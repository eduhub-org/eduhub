import Stripe from 'stripe';
import { GraphQLClient } from 'graphql-request';

import {
  getOrCreateTaxRate,
  buildInvoiceCreation,
  buildPaymentMethodConfig,
  getOrCreateCustomer,
} from '../lib/stripeTax.js';

const GET_COURSE_AND_ADDONS = `
  query GetCourseAndAddons($courseId: Int!) {
    Course_by_pk(id: $courseId) {
      id
      title
      basePrice
      currency
      stripeProductId
      stripePriceId
      Program {
        Organization {
          id
          name
          defaultVatRate
          defaultTaxExemptionNote
          invoiceFooterText
        }
      }
      CourseAddonMappings {
        id
        questionId
        choiceId
        validatedPrice
        currency
        stripeProductId
        stripePriceId
      }
    }
  }
`;

const GET_ENROLLMENT_USER = `
  query GetEnrollmentUser($enrollmentId: Int!) {
    CourseEnrollment_by_pk(id: $enrollmentId) {
      courseId
      userId
      User {
        email
      }
    }
  }
`;

const GET_ENROLLMENT_ADDONS = `
  query GetEnrollmentAddons($enrollmentId: Int!) {
    CourseEnrollmentAddon(where: { enrollmentId: { _eq: $enrollmentId } }) {
      id
      addonMappingId
      priceAtPurchase
      currency
      CourseAddonMapping {
        id
        questionId
        choiceId
        description
        validatedPrice
        currency
        stripeProductId
        stripePriceId
      }
    }
  }
`;

/**
 * Creates a Stripe Checkout Session for course enrollment with add-ons.
 * Builds success and cancel URLs server-side from FRONTEND_URL for security.
 * Reads addons from CourseEnrollmentAddon table using enrollmentId.
 * 
 * @param {Object} req - Request object containing body with courseId, enrollmentId, formbricksResponseId, userEmail
 * @param {Object} logger - Winston logger instance
 * @returns {Object} Checkout session URL
 */
export default async function createStripeCheckout(req, logger) {
  logger.info("########## Create Stripe Checkout ##########");
  logger.debug(`Request body: ${JSON.stringify(req.body)}`);

  try {
    const sessionUserId = req.body?.session_variables?.['x-hasura-user-id'];
    const {
      courseId,
      enrollmentId,
      formbricksResponseId,
      userEmail
    } = req.body.input || req.body;

    if (!courseId) {
      return {
        success: false,
        error: 'Course ID is required',
        messageKey: 'MISSING_COURSE_ID'
      };
    }

    if (!enrollmentId) {
      return {
        success: false,
        error: 'Enrollment ID is required',
        messageKey: 'MISSING_ENROLLMENT_ID'
      };
    }

    if (!sessionUserId) {
      return {
        success: false,
        error: 'Missing authenticated session user',
        messageKey: 'UNAUTHORIZED'
      };
    }

    // Build URLs server-side from trusted FRONTEND_URL
    const frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl) {
      logger.error('FRONTEND_URL environment variable not configured');
      return {
        success: false,
        error: 'Frontend URL not configured',
        messageKey: 'FRONTEND_URL_NOT_CONFIGURED'
      };
    }

    // Build success and cancel URLs server-side
    const successUrl = `${frontendUrl}/course/${courseId}/payment-success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${frontendUrl}/course/${courseId}/payment-cancelled`;

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      logger.error('Stripe secret key missing');
      return {
        success: false,
        error: 'Stripe secret key not configured',
        messageKey: 'STRIPE_NOT_CONFIGURED'
      };
    }

    const stripe = new Stripe(stripeSecretKey);

    // Fetch course and addon mappings from Hasura
    const client = new GraphQLClient(process.env.HASURA_ENDPOINT, {
      headers: {
        'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET,
      },
    });

    const courseData = await client.request(GET_COURSE_AND_ADDONS, { courseId });
    const course = courseData.Course_by_pk;

    if (!course) {
      return {
        success: false,
        error: 'Course not found',
        messageKey: 'COURSE_NOT_FOUND'
      };
    }

    // Fetch enrollment once to verify ownership and get user email if needed.
    let emailToUse = userEmail;
    try {
      const enrollmentData = await client.request(GET_ENROLLMENT_USER, { enrollmentId });
      const enrollment = enrollmentData.CourseEnrollment_by_pk;
      if (!enrollment) {
        return {
          success: false,
          error: 'Enrollment not found',
          messageKey: 'ENROLLMENT_NOT_FOUND'
        };
      }

      if (String(enrollment.userId) !== String(sessionUserId)) {
        return {
          success: false,
          error: 'Enrollment does not belong to authenticated user',
          messageKey: 'UNAUTHORIZED'
        };
      }

      if (Number(enrollment.courseId) !== Number(courseId)) {
        return {
          success: false,
          error: 'Enrollment course mismatch',
          messageKey: 'INVALID_ENROLLMENT'
        };
      }

      if ((!emailToUse || emailToUse.trim() === '') && enrollment?.User?.email) {
        emailToUse = enrollment.User.email;
      }
    } catch (error) {
      logger.warn('Could not verify enrollment ownership', { error: error.message });
      return {
        success: false,
        error: 'Unable to verify enrollment ownership',
        messageKey: 'UNAUTHORIZED'
      };
    }

    // Fetch selected addons from CourseEnrollmentAddon table
    let enrollmentAddons = [];
    try {
      const addonsData = await client.request(GET_ENROLLMENT_ADDONS, { enrollmentId });
      enrollmentAddons = addonsData.CourseEnrollmentAddon || [];
      logger.info('Fetched enrollment addons from database', {
        enrollmentId,
        addonCount: enrollmentAddons.length
      });
    } catch (error) {
      logger.warn('Could not fetch enrollment addons from database', { 
        error: error.message,
        enrollmentId 
      });
      // Continue without addons - user will only pay base price
    }

    // Build line items array
    const lineItems = [];

    // Add base course price if it exists
    if (course.basePrice && course.basePrice > 0) {
      if (course.stripePriceId) {
        // Verify the Stripe Price ID is valid and has correct amount
        try {
          const stripePrice = await stripe.prices.retrieve(course.stripePriceId);
          
          // Check if the Stripe price is active, one-time, matches currency, and amount matches our basePrice (in cents)
          // If any check fails, fall back to dynamic pricing
          const expectedCurrency = (course.currency || 'eur').toLowerCase();
          if (
            stripePrice.active === true &&
            stripePrice.type === 'one_time' &&
            stripePrice.currency?.toLowerCase() === expectedCurrency &&
            stripePrice.unit_amount &&
            stripePrice.unit_amount > 0 &&
            stripePrice.unit_amount === course.basePrice
          ) {
            // Use existing Stripe Price ID
            lineItems.push({
              price: course.stripePriceId,
              quantity: 1
            });
            logger.debug('Using existing Stripe Price ID', {
              stripePriceId: course.stripePriceId,
              amount: stripePrice.unit_amount
            });
          } else {
            // Price ID exists but validation failed (not active, wrong type, currency mismatch, or amount mismatch), use dynamic pricing
            logger.warn('Stripe Price ID validation failed, using dynamic pricing', {
              stripePriceId: course.stripePriceId,
              stripeActive: stripePrice.active,
              stripeType: stripePrice.type,
              stripeCurrency: stripePrice.currency,
              stripeAmount: stripePrice.unit_amount,
              expectedCurrency: expectedCurrency,
              expectedAmount: course.basePrice
            });
            lineItems.push({
              price_data: {
                currency: (course.currency || 'eur').toLowerCase(),
                product_data: {
                  name: course.title || 'Course Enrollment'
                },
                unit_amount: course.basePrice
              },
              quantity: 1
            });
          }
        } catch (error) {
          // Stripe Price ID doesn't exist or is invalid, fall back to dynamic pricing
          logger.warn('Stripe Price ID not found or invalid, using dynamic pricing', {
            stripePriceId: course.stripePriceId,
            error: error.message
          });
          lineItems.push({
            price_data: {
              currency: (course.currency || 'eur').toLowerCase(),
              product_data: {
                name: course.title || 'Course Enrollment'
              },
              unit_amount: course.basePrice
            },
            quantity: 1
          });
        }
      } else {
        // Create dynamic price (no Stripe Price ID exists)
        lineItems.push({
          price_data: {
            currency: (course.currency || 'eur').toLowerCase(),
            product_data: {
              name: course.title || 'Course Enrollment'
            },
            unit_amount: course.basePrice
          },
          quantity: 1
        });
        logger.debug('Using dynamic pricing', {
          basePrice: course.basePrice,
          currency: course.currency || 'eur'
        });
      }
    }

    // Add selected add-ons as line items (from CourseEnrollmentAddon table)
    for (const enrollmentAddon of enrollmentAddons) {
      const addonMapping = enrollmentAddon.CourseAddonMapping;
      if (!addonMapping) {
        logger.warn('CourseEnrollmentAddon missing CourseAddonMapping', {
          enrollmentAddonId: enrollmentAddon.id,
          addonMappingId: enrollmentAddon.addonMappingId
        });
        continue;
      }

      // Use priceAtPurchase from CourseEnrollmentAddon (price at time of purchase)
      // Use nullish coalescing so legitimate 0 price is preserved (not treated as absent)
      const addonPrice = enrollmentAddon.priceAtPurchase ?? addonMapping.validatedPrice;
      
      if (addonPrice > 0) {
        if (addonMapping.stripePriceId) {
          // Verify the Stripe Price ID is valid and matches requirements
          try {
            const stripePrice = await stripe.prices.retrieve(addonMapping.stripePriceId);
            const expectedCurrency = (enrollmentAddon.currency || addonMapping.currency || course.currency || 'eur').toLowerCase();
            
            // Check if the Stripe price is active, one-time, matches currency, and amount matches addonPrice
            if (
              stripePrice.active === true &&
              stripePrice.type === 'one_time' &&
              stripePrice.currency?.toLowerCase() === expectedCurrency &&
              stripePrice.unit_amount &&
              stripePrice.unit_amount > 0 &&
              stripePrice.unit_amount === addonPrice
            ) {
              // Use existing Stripe Price ID
              lineItems.push({
                price: addonMapping.stripePriceId,
                quantity: 1
              });
              logger.debug('Using existing Stripe Price ID for addon', {
                addonMappingId: addonMapping.id,
                stripePriceId: addonMapping.stripePriceId
              });
            } else {
              // Price ID exists but validation failed, use dynamic pricing
              logger.warn('Stripe Price ID validation failed for addon, using dynamic pricing', {
                addonMappingId: addonMapping.id,
                stripePriceId: addonMapping.stripePriceId,
                stripeActive: stripePrice.active,
                stripeType: stripePrice.type,
                stripeCurrency: stripePrice.currency,
                stripeAmount: stripePrice.unit_amount,
                expectedCurrency: expectedCurrency,
                expectedAmount: addonPrice
              });
              lineItems.push({
                price_data: {
                  currency: expectedCurrency,
                  product_data: {
                    name: addonMapping.description || `Add-on for ${course.title}`
                  },
                  unit_amount: addonPrice
                },
                quantity: 1
              });
            }
          } catch (error) {
            // Stripe Price ID doesn't exist or is invalid, fall back to dynamic pricing
            logger.warn('Stripe Price ID not found or invalid for addon, using dynamic pricing', {
              addonMappingId: addonMapping.id,
              stripePriceId: addonMapping.stripePriceId,
              error: error.message
            });
            const expectedCurrency = (enrollmentAddon.currency || addonMapping.currency || course.currency || 'eur').toLowerCase();
            lineItems.push({
              price_data: {
                currency: expectedCurrency,
                product_data: {
                  name: addonMapping.description || `Add-on for ${course.title}`
                },
                unit_amount: addonPrice
              },
              quantity: 1
            });
          }
        } else {
          // Create dynamic price for addon (no Stripe Price ID exists)
          lineItems.push({
            price_data: {
              currency: (enrollmentAddon.currency || addonMapping.currency || course.currency || 'eur').toLowerCase(),
              product_data: {
                name: addonMapping.description || `Add-on for ${course.title}`
              },
              unit_amount: addonPrice
            },
            quantity: 1
          });
          logger.debug('Using dynamic pricing for addon', {
            addonMappingId: addonMapping.id,
            description: addonMapping.description,
            price: addonPrice
          });
        }
      }
    }

    // Log line items for debugging
    logger.debug('Line items prepared', {
      lineItemCount: lineItems.length,
      courseBasePrice: course.basePrice,
      courseStripePriceId: course.stripePriceId,
      enrollmentAddonsCount: enrollmentAddons.length,
      lineItems: lineItems.map(item => ({
        hasPrice: !!item.price,
        hasPriceData: !!item.price_data,
        unitAmount: item.price_data?.unit_amount
      }))
    });

    if (lineItems.length === 0) {
      // Log detailed information for debugging
      logger.error('No items to charge - cannot create Stripe checkout', {
        courseId,
        enrollmentId,
        courseBasePrice: course.basePrice,
        courseHasBasePrice: !!(course.basePrice && course.basePrice > 0),
        enrollmentAddonsCount: enrollmentAddons.length,
        enrollmentAddons: enrollmentAddons.map(addon => ({
          id: addon.id,
          addonMappingId: addon.addonMappingId,
          priceAtPurchase: addon.priceAtPurchase,
          hasMapping: !!addon.CourseAddonMapping,
          mappingPrice: addon.CourseAddonMapping?.validatedPrice
        })),
        possibleCauses: [
          'Course has no base price configured (basePrice is 0 or null)',
          'No add-ons were selected in the Formbricks survey',
          'Add-ons were selected but not saved to CourseEnrollmentAddon table',
          'All selected add-ons have price 0',
          'CourseEnrollmentAddon records exist but CourseAddonMapping is missing'
        ]
      });

      return {
        success: false,
        error: 'No items to charge. Course has no base price and no add-ons selected. Please ensure the course has a base price configured or that add-ons are selected in the registration survey.',
        messageKey: 'NO_ITEMS_TO_CHARGE'
      };
    }

    // German VAT (production-readiness review 2026-07-11): course prices
    // are consumer-facing GROSS prices, so the selling organization's
    // defaultVatRate is applied as an INCLUSIVE tax rate. 0/null means
    // tax-exempt; the exemption note lands on the invoice footer below.
    const organization = course.Program?.Organization || null;
    const vatRate = organization?.defaultVatRate != null ? Number(organization.defaultVatRate) : null;
    if (vatRate && vatRate > 0) {
      const taxRateId = await getOrCreateTaxRate(stripe, vatRate, true, logger);
      if (taxRateId) {
        for (const item of lineItems) {
          item.tax_rates = [taxRateId];
        }
      }
    } else if (!organization?.defaultTaxExemptionNote) {
      logger.warn('Organization has no defaultVatRate and no defaultTaxExemptionNote — invoice will carry neither VAT nor an exemption note', {
        organizationId: organization?.id,
        courseId,
      });
    }

    // A named customer keeps repeat purchases and their invoices on one
    // record; without an email Stripe creates one during checkout instead.
    let stripeCustomerId = null;
    if (emailToUse && emailToUse.trim() !== '' && emailToUse.includes('@')) {
      stripeCustomerId = await getOrCreateCustomer(stripe, emailToUse.trim());
    }

    // Create Stripe Checkout Session
    const sessionConfig = {
      line_items: lineItems,
      mode: 'payment',
      // Card and SEPA debit; the latter settles via the
      // checkout.session.async_payment_* events.
      ...buildPaymentMethodConfig(stripeCustomerId),
      // Stripe issues a real, sequentially numbered invoice (§14 UStG);
      // the webhook stores its hosted/PDF URLs on the Invoice row.
      invoice_creation: buildInvoiceCreation(organization),
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        courseId: String(courseId),
        courseName: course.title || '',
        enrollmentId: String(enrollmentId),
        formbricksResponseId: formbricksResponseId || '',
        source: 'eduhub',
        organizationId: organization?.id != null ? String(organization.id) : '',
        organizationName: organization?.name || '',
        selectedAddons: (() => {
          if (!enrollmentAddons || enrollmentAddons.length === 0) {
            return '';
          }
          // Map to essential identifiers with validatedPrice for audit trail
          const mappedAddons = enrollmentAddons.map(enrollmentAddon => ({
            id: enrollmentAddon.CourseAddonMapping?.id || enrollmentAddon.addonMappingId,
            questionId: enrollmentAddon.CourseAddonMapping?.questionId,
            choiceId: enrollmentAddon.CourseAddonMapping?.choiceId,
            validatedPrice: enrollmentAddon.priceAtPurchase
          })).filter(addon => addon.id); // Filter out any with missing data
          
          const serialized = JSON.stringify(mappedAddons);
          // Stripe metadata has 500 char limit per key - validate and fall back if exceeded
          if (serialized.length > 500) {
            logger.warn('selectedAddons metadata exceeds 500 chars, omitting from metadata', {
              length: serialized.length,
              addonCount: enrollmentAddons.length
            });
            return '';
          }
          return serialized;
        })()
      },
      payment_intent_data: {
        metadata: {
          courseId: String(courseId),
          courseName: course.title || '',
          enrollmentId: String(enrollmentId),
          organizationId: organization?.id != null ? String(organization.id) : '',
          organizationName: organization?.name || '',
        }
      }
    };

    // Without a customer, let Stripe prompt for the email during checkout.

    const session = await stripe.checkout.sessions.create(sessionConfig);

    logger.info('Created Stripe Checkout Session', {
      sessionId: session.id,
      courseId,
      enrollmentId,
      lineItemCount: lineItems.length
    });

    return {
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id
    };

  } catch (error) {
    logger.error('Error creating Stripe Checkout Session', {
      error: error.message,
      stack: error.stack
    });

    return {
      success: false,
      error: error.message || 'Internal server error',
      messageKey: 'CHECKOUT_CREATION_ERROR'
    };
  }
}
