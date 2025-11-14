import 'https://cdn.jsdelivr.net/gh/orestbida/cookieconsent@3.1.0/dist/cookieconsent.umd.js';
import * as Sentry from "@sentry/react";


CookieConsent.run({
    guiOptions: {
        consentModal: {
            layout: "cloud inline",
            position: "bottom right",
            equalWeightButtons: false,
            flipButtons: false
        },
        preferencesModal: {
            layout: "box",
            position: "right",
            equalWeightButtons: false,
            flipButtons: true
        }
    },
    categories: {
        necessary: {
            readOnly: true
        },
        functionality: {},
        analytics: {
            enabled: true
        },
        marketing: {}
    },
    language: {
        default: "en",
        autoDetect: "browser",
        translations: {
            'de': '/config/cookie_consent_modal/translations/de.json',
            'en': '/config/cookie_consent_modal/translations/en.json',
            'es': '/config/cookie_consent_modal/translations/es.json',
            'fr': '/config/cookie_consent_modal/translations/fr.json',
            'it': '/config/cookie_consent_modal/translations/it.json',
            'ja': '/config/cookie_consent_modal/translations/ja.json',
        }
    },
    onConsent: function(){
        if(CookieConsent.acceptedCategory('analytics')) {
            Sentry.init({
                environment: process.env.NODE_ENV || "development",
                dsn: "https://beb5f109e66475063b4650877bc1c6a1@o4510353682006016.ingest.de.sentry.io/4510353685610576",
                // Setting this option to true will send default PII data to Sentry.
                // For example, automatic IP address collection on events
                sendDefaultPii: true,
                integrations: [
                    Sentry.browserTracingIntegration(),
                    Sentry.replayIntegration({
                        maskAllText: false,
                        blockAllMedia: false,
                    })
                ],
                // Tracing
                tracesSampleRate: 1.0, //  Capture 100% of the transactions
                // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
                tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],
                // Session Replay
                replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
                replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.,
                // Enable logs to be sent to Sentry
                enableLogs: true,
            });
        }
    }
});