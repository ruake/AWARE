module.exports = {
  apps: [{
    name: "aware-app",
    cwd: "/home/runner/workspace/artifacts/aware-app",
    script: "/home/runner/workspace/artifacts/aware-app/node_modules/.bin/vite",
    args: "--config vite.config.ts --host 0.0.0.0",
    exec_mode: "fork",
    env: {
      NODE_ENV: "development",
    },
  }],
};
