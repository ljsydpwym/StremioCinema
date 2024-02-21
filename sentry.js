const env = require('./env.js')
const Sentry = require("@sentry/node");
const ProfilingIntegration = require("@sentry/profiling-node").ProfilingIntegration;

function init(app){
    Sentry.init({
        environment: env.DEBUG ? "develop" : "production",
        dsn: env.SENTRY_DSN,
        integrations: [
            new Sentry.Integrations.Http({ tracing: true }),
            new Sentry.Integrations.Express({ app }),
            new ProfilingIntegration(),
        ],
        tracesSampleRate: 0.5,
        profilesSampleRate: 0.5,
    });

    app.use(Sentry.Handlers.requestHandler());
    app.use(Sentry.Handlers.tracingHandler());
}

module.exports = {
    init
}