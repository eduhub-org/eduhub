const { i18n } = require("./next-i18next.config");

module.exports = {
  output: "standalone",
  i18n,
  images: {
    domains: ["picsum.photos", "images.unsplash.com"],
  },
};
