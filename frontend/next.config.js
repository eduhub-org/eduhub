const { i18n } = require("./next-i18next.config");

module.exports = {
  i18n,
  images: {
    domains: ["picsum.photos", "images.unsplash.com"],
  },
  rewrites: async () => {
    return [
      {
        source: "/data/v1/graphql",
        destination: "http://localhost:8080/api/v1/graphql",
      },
    ];
  },
};
