import { LocalStorageConstants, LocalStorageUtils, URLUtils } from '@deriv-com/utils';
import { isStaging } from '../url/helpers';

export const APP_IDS = {
    LOCALHOST: 36300,
    TMP_STAGING: 64584,
    STAGING: 29934,
    STAGING_BE: 29934,
    STAGING_ME: 29934,
    PRODUCTION: 65555,
    PRODUCTION_BE: 65556,
    PRODUCTION_ME: 65557,
};

export const livechat_license_id = 12049137;
export const livechat_client_id = '66aa088aad5a414484c1fd1fa8a5ace7';

export const domain_app_ids = {
    'master.bot-standalone.pages.dev': APP_IDS.TMP_STAGING,
    'staging-dbot.deriv.com': APP_IDS.STAGING,
    'staging-dbot.deriv.be': APP_IDS.STAGING_BE,
    'staging-dbot.deriv.me': APP_IDS.STAGING_ME,
    'dbot.deriv.com': APP_IDS.PRODUCTION,
    'dbot.deriv.be': APP_IDS.PRODUCTION_BE,
    'dbot.deriv.me': APP_IDS.PRODUCTION_ME,
};

export const getCurrentProductionDomain = () =>
    Object.keys(domain_app_ids).find(domain => window.location.hostname === domain) || '';

export const isProduction = () => {
    const all_domains = Object.keys(domain_app_ids).map(domain => `(www\\.)?${domain.replace(/\./g, '\\.')}`);
    return new RegExp(`^(${all_domains.join('|')})$`, 'i').test(window.location.hostname);
};

export const isTestLink = () => {
    return (
        window.location.origin?.includes('.binary.sx') ||
        window.location.origin?.includes('bot-65f.pages.dev') ||
        isLocal()
    );
};

export const isLocal = () => /localhost(:\d+)?$/i.test(window.location.hostname);

const getDefaultServerURL = () => {
    if (isTestLink()) {
        return 'ws.derivws.com';
    }

    const params = new URLSearchParams(window.location.search);
    const loginid = window.localStorage.getItem('active_loginid') || params.get('acct1');
    const is_real = loginid && !/^(VRT|VRW)/.test(loginid);

    return `${is_real ? 'green' : 'blue'}.derivws.com`;
};

export const getDefaultAppIdAndUrl = () => {
    const server_url = getDefaultServerURL();
    const current_domain = getCurrentProductionDomain();
    const app_id = domain_app_ids[current_domain] || APP_IDS.PRODUCTION;
    return { app_id, server_url };
};

export const getAppId = () => {
    const config_app_id = window.localStorage.getItem('config.app_id');
    if (config_app_id) {
        return parseInt(config_app_id, 10) || APP_IDS.PRODUCTION;
    }
    if (isStaging()) return APP_IDS.STAGING;
    if (isTestLink()) return APP_IDS.LOCALHOST;
    return domain_app_ids[getCurrentProductionDomain()] || APP_IDS.PRODUCTION;
};

export const getSocketURL = () => {
    return window.localStorage.getItem('config.server_url') || getDefaultServerURL();
};

export const checkAndSetEndpointFromUrl = () => {
    if (isTestLink()) {
        const url_params = new URLSearchParams(location.search);
        const qa_server = url_params.get('qa_server');
        const app_id = url_params.get('app_id');

        if (qa_server && app_id && /^[0-9]+$/.test(app_id)) {
            localStorage.setItem('config.app_id', app_id);
            localStorage.setItem('config.server_url', qa_server.replace(/"/g, ''));
            url_params.delete('qa_server');
            url_params.delete('app_id');

            location.href = `${location.origin}${location.pathname}${url_params.toString() ? `?${url_params}` : ''}${location.hash}`;
            return true;
        }
    }
    return false;
};

export const getDebugServiceWorker = () => {
    return !!parseInt(window.localStorage.getItem('debug_service_worker') || '0', 10);
};

export const generateOAuthURL = () => {
    const { getOauthURL } = URLUtils;
    const oauth_url = getOauthURL();
    const original_url = new URL(oauth_url);
    const configured_server_url =
        LocalStorageUtils.getValue(LocalStorageConstants.configServerURL) ||
        window.localStorage.getItem('config.server_url') ||
        original_url.hostname;

    const valid_server_urls = ['green.derivws.com', 'red.derivws.com', 'blue.derivws.com', 'ws.derivws.com'];

    original_url.searchParams.set('app_id', '68643'); // Ensure it uses the correct app ID

    if (!valid_server_urls.includes(configured_server_url)) {
        original_url.hostname = 'ws.derivws.com'; // Default to a known valid hostname
    }
    return original_url.toString();
};

export const redirectToLogin = () => {
    const is_logged_in = window.localStorage.getItem('active_loginid') !== null;
    if (!is_logged_in) {
        const redirect_url = window.location.href;
        try {
            sessionStorage.setItem('redirect_url', redirect_url);
        } catch (e) {
            console.warn('Session storage is not supported, redirect URL will not be stored.');
        }
        window.location.href = generateOAuthURL();
    }
};
