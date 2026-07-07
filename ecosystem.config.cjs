module.exports = {
  apps: [{
    name: "aware-app",
    script: "pnpm",
    args: "dev",
    cwd: "/home/runner/workspace/artifacts/aware-app",
    interpreter: "none",
    env: {
      NODE_ENV: "development",
    },
  }],
};
