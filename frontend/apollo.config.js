module.exports = {
  client: {
    service: {
      name: "hasura",
      url: process.env.GRAPHQL_URI
        ? process.env.GRAPHQL_URI
        : "http://localhost:8080/v1/graphql",
      headers: {
        "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET ?? "",
      },
    },
  },
};
