const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  ...expoConfig,
  {
    settings: {
      "import/resolver": {
        typescript: true,
        node: { extensions: [".js", ".jsx", ".ts", ".tsx"] },
      },
    },
  },
]);
