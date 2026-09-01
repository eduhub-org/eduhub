<#macro registrationLayout bodyClass="" displayInfo=false displayMessage=true displayRequiredFields=false showAnotherWayIfPresent=true>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"  "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" class="${properties.kcHtmlClass!}">

<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="robots" content="noindex, nofollow">

    <#if properties.meta?has_content>
        <#list properties.meta?split(' ') as meta>
            <meta name="${meta?split('==')[0]}" content="${meta?split('==')[1]}"/>
        </#list>
    </#if>
    <title>${msg("loginTitle",(realm.displayName!''))}</title>
    <link rel="icon" href="${url.resourcesPath}/img/favicon.ico" />
    <#if properties.stylesCommon?has_content>
        <#list properties.stylesCommon?split(' ') as style>
            <link href="${url.resourcesCommonPath}/${style}" rel="stylesheet" />
        </#list>
    </#if>
    <#if properties.styles?has_content>
        <#list properties.styles?split(' ') as style>
            <link href="${url.resourcesPath}/${style}" rel="stylesheet" />
        </#list>
    </#if>
    <#if properties.scripts?has_content>
        <#list properties.scripts?split(' ') as script>
            <script src="${url.resourcesPath}/${script}" type="text/javascript"></script>
        </#list>
    </#if>
    <#-- Inline brand bootstrap so the co-branding still applies if the
         external theme JS is served from a stale Keycloak resource cache. -->
    <script type="text/javascript">
      (function () {
        try {
          var params = new URLSearchParams(window.location.search);
          var portal = (params.get('stujo_portal') || '').toLowerCase();
          var brand = null;
          if (portal === 'stujo-haw-kiel' || portal === 'stujo-flensburg') {
            brand = portal;
          } else if (portal.indexOf('stujo') === 0) {
            brand = 'stujo';
          } else {
            var redirect = params.get('redirect_uri') || '';
            var host = '';
            try { host = new URL(redirect).hostname.toLowerCase(); } catch (e) { host = redirect.toLowerCase(); }
            if (/haw-kiel|fh-kiel/.test(host)) brand = 'stujo-haw-kiel';
            else if (/flensburg/.test(host)) brand = 'stujo-flensburg';
            else if (/stujo|localhost:5001|127\.0\.0\.1:5001/.test(redirect)) brand = 'stujo';
          }
          if (!brand) brand = sessionStorage.getItem('kc-app-brand');
          if (!brand || brand === 'eduhub') return;
          sessionStorage.setItem('kc-app-brand', brand);
          document.documentElement.classList.add('stujo-brand');
          if (brand === 'stujo-haw-kiel' || brand === 'stujo-flensburg') {
            document.documentElement.classList.add(brand);
          }
        } catch (e) { /* ignore */ }
      })();
    </script>
    <#if scripts??>
        <#list scripts as script>
            <script src="${script}" type="text/javascript"></script>
        </#list>
    </#if>
</head>

<body class="${properties.kcBodyClass!}">
    <div class="content-wrapper">
        <div class="academy_header_guest">
            <nav class="navbar navbar-light navbar-expand-md p-0">
                <div class="navbar-logo-wrapper">
                    <img class="navbar-logo" src="${url.resourcesPath}/img/edu_logo.svg">
                    <img class="navbar-logo-text" src="${url.resourcesPath}/img/logo_text.svg">
                    <#-- Co-brand slot: the EduHub lockup above always stays, the
                         portal mark is added next to it so people recognise that
                         StuJo runs on their EduHub account. Revealed by
                         css/stujo-portals.css via js/stujo-portal-brand.js. -->
                    <div class="navbar-cobrand">
                        <span class="navbar-cobrand-divider"></span>
                        <span class="navbar-cobrand-plate">
                            <img class="navbar-cobrand-logo navbar-cobrand-stujo" src="${url.resourcesPath}/img/stujo_header_logo.png" alt="StuJo">
                            <img class="navbar-cobrand-logo navbar-cobrand-haw-kiel" src="${url.resourcesPath}/img/stujo_logo_haw_kiel.png" alt="StuJo HAW Kiel">
                            <img class="navbar-cobrand-logo navbar-cobrand-flensburg" src="${url.resourcesPath}/img/stujo_logo_flensburg.png" alt="StuJo Campus Flensburg">
                        </span>
                    </div>
                </div>
                <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav" aria-controls="navbarNav" aria-expanded="true" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
                </button>
                <div class="collapse navbar-collapse p-2" id="navbarNav">
                <div class="my-2 my-lg-0 navbar-nav" >
                </div>
                </div>
            </nav>
            </div>
            <div class="${properties.kcLoginClass!}">
                <div id="kc-header" class="${properties.kcHeaderClass!}">

                </div>
                <div class="${properties.kcFormCardClass!}">
                    <header class="${properties.kcFormHeaderClass!}">
                        <#if realm.internationalizationEnabled  && locale.supported?size gt 1>
                            <div class="${properties.kcLocaleMainClass!}" id="kc-locale">
                                <div id="kc-locale-wrapper" class="${properties.kcLocaleWrapperClass!}">
                                    <div id="kc-locale-dropdown" class="${properties.kcLocaleDropDownClass!}">
                                        <a href="#" id="kc-current-locale-link">${locale.current}</a>
                                        <ul class="${properties.kcLocaleListClass!}">
                                            <#list locale.supported as l>
                                                <li class="${properties.kcLocaleListItemClass!}">
                                                    <a class="${properties.kcLocaleItemClass!}" href="${l.url}">${l.label}</a>
                                                </li>
                                            </#list>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </#if>
                    <#if !(auth?has_content && auth.showUsername() && !auth.showResetCredentials())>
                        <#if displayRequiredFields>
                            <h1 id="kc-page-title"><#nested "header"></h1>
                            <div class="${properties.kcContentWrapperClass!}">
                                <div class="${properties.kcLabelWrapperClass!} subtitle">
                                    <span class="subtitle"><span class="required">*</span> ${msg("requiredFields")}</span>
                                </div>
                            </div>
                        <#else>
                            <h1 id="kc-page-title"><#nested "header"></h1>
                        </#if>
                    <#else>
                        <#if displayRequiredFields>
                            <div class="${properties.kcContentWrapperClass!}">
                                <div class="${properties.kcLabelWrapperClass!} subtitle">
                                    <span class="subtitle"><span class="required">*</span> ${msg("requiredFields")}</span>
                                </div>
                                <div class="col-md-10">
                                    <#nested "show-username">
                                    <div id="kc-username" class="${properties.kcFormGroupClass!}">
                                        <label id="kc-attempted-username">${auth.attemptedUsername}</label>
                                        <a id="reset-login" href="${url.loginRestartFlowUrl}">
                                            <div class="kc-login-tooltip">
                                                <i class="${properties.kcResetFlowIcon!}"></i>
                                                <span class="kc-tooltip-text">${msg("restartLoginTooltip")}</span>
                                            </div>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        <#else>
                            <#nested "show-username">
                            <div id="kc-username" class="${properties.kcFormGroupClass!}">
                                <label id="kc-attempted-username">${auth.attemptedUsername}</label>
                                <a id="reset-login" href="${url.loginRestartFlowUrl}">
                                    <div class="kc-login-tooltip">
                                        <i class="${properties.kcResetFlowIcon!}"></i>
                                        <span class="kc-tooltip-text">${msg("restartLoginTooltip")}</span>
                                    </div>
                                </a>
                            </div>
                        </#if>
                    </#if>
                </header>
                <div id="kc-content">
                    <div id="kc-content-wrapper">

                    <#-- App-initiated actions should not see warning messages about the need to complete the action -->
                    <#-- during login.                                                                               -->
                    <#if displayMessage && message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
                        <div class="alert-${message.type} ${properties.kcAlertClass!} pf-m-<#if message.type = 'error'>danger<#else>${message.type}</#if>">
                            <div class="pf-c-alert__icon">
                                <#if message.type = 'success'><span class="${properties.kcFeedbackSuccessIcon!}"></span></#if>
                                <#if message.type = 'warning'><span class="${properties.kcFeedbackWarningIcon!}"></span></#if>
                                <#if message.type = 'error'><span class="${properties.kcFeedbackErrorIcon!}"></span></#if>
                                <#if message.type = 'info'><span class="${properties.kcFeedbackInfoIcon!}"></span></#if>
                            </div>
                                <span class="${properties.kcAlertTitleClass!}">${kcSanitize(message.summary)?no_esc}</span>
                        </div>
                    </#if>

                    <#-- StuJo and EduHub share one account; say so before people
                         try to register a second time. Hidden for EduHub itself. -->
                    <div class="kc-cobrand-note">${msg("cobrandAccountNote")}</div>

                    <#nested "form">

                        <#if auth?has_content && auth.showTryAnotherWayLink() && showAnotherWayIfPresent>
                            <form id="kc-select-try-another-way-form" action="${url.loginAction}" method="post">
                                <div class="${properties.kcFormGroupClass!}">
                                    <input type="hidden" name="tryAnotherWay" value="on"/>
                                    <a href="#" id="try-another-way"
                                    onclick="document.forms['kc-select-try-another-way-form'].submit();return false;">${msg("doTryAnotherWay")}</a>
                                </div>
                            </form>
                        </#if>
                        
                      <#nested "socialProviders">
                    
                    <#if displayInfo>
                        <div id="kc-info" class="${properties.kcSignUpClass!}">
                            <div id="kc-info-wrapper" class="${properties.kcInfoAreaWrapperClass!}">
                                <#nested "info">
                            </div>
                        </div>
                    </#if>
                    </div>
                </div>

                </div>
            </div>
    </div>
</body>
</html>
</#macro>
