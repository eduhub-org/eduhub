<#-- Both pages use the actual configured providers. Dev previews only appear
     when explicitly enabled by the server environment and no providers exist. -->
<#macro buttons registration=false>
    <#local providers = (social.providers)![]>
    <#local preview = (properties.ssoPreview!"false") == "true" && !providers?has_content>
    <#if preview>
        <#local providers = [
            {"alias": "dlc", "displayName": "Digital Learning Campus", "iconClasses": ""},
            {"alias": "google", "displayName": "Google", "iconClasses": "fa fa-google"},
            {"alias": "linkedin", "displayName": "LinkedIn", "iconClasses": "fa fa-linkedin"},
            {"alias": "github", "displayName": "GitHub", "iconClasses": "fa fa-github"}
        ]>
    </#if>
    <#if providers?has_content>
        <div id="kc-social-providers" class="${properties.kcFormSocialAccountSectionClass!}">
            <div class="kc-auth-divider">
                <h4><#if registration>${msg("identity-provider-register-label")}<#else>${msg("identity-provider-login-label")}</#if></h4>
            </div>
            <ul class="kc-social-links<#if providers?size gt 1> kc-social-grid</#if>">
                <#list providers as p>
                    <#local isDlc = p.alias?lower_case?contains("dlc") || (p.displayName!"")?lower_case?contains("dlc") || (p.displayName!"")?lower_case?contains("digital learning campus")>
                    <li>
                        <#if preview>
                            <button id="social-${p.alias}" class="kc-social-button" type="button" aria-describedby="kc-sso-preview-note">
                        <#else>
                            <a id="social-${p.alias}" class="kc-social-button" href="${p.loginUrl}">
                        </#if>
                            <#if isDlc>
                                <img class="kc-social-provider-image" src="${url.resourcesPath}/img/dlc-logo.svg" alt="" />
                                <span class="kc-social-provider-name kc-social-dlc-name">Digital Learning<br>Campus</span>
                            <#else>
                                <#if p.iconClasses?has_content>
                                    <i class="kc-social-provider-logo ${p.iconClasses}" aria-hidden="true"></i>
                                </#if>
                                <span class="kc-social-provider-name">${p.displayName!}</span>
                            </#if>
                        <#if preview></button><#else></a></#if>
                    </li>
                </#list>
            </ul>
            <#if preview>
                <p id="kc-sso-preview-note">${msg("identity-provider-preview-note")}</p>
            </#if>
        </div>
    </#if>
</#macro>
