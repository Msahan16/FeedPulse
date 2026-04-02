module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  setupFiles: ["<rootDir>/tests/setupEnv.ts"],
  clearMocks: true,
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.test.json" }],
  },
};
