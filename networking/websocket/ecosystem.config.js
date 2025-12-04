module.exports = {
    apps: [
        {
            name: "y-websocket-server",
            script: "./node_modules/.bin/y-websocket-server",
            env: {
                HOST: "0.0.0.0",
                PORT: "47964"
            }
        }
    ]
};
