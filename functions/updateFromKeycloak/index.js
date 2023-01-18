const KcAdminClient = require("@keycloak/keycloak-admin-client").default;

const { createClient } = require("graphqurl");

exports.updateFromKeycloak = async (req, res) => {
  console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
  console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
  console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
  console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
  if (process.env.HASURA_CLOUD_FUNCTION_SECRET == req.headers.secret) {
    const kcAdminClient = new KcAdminClient({
      baseUrl: process.env.KEYCLOAK_URL,
      //baseUrl: 'http://0.0.0.0:28080',
      realmName: "master",
    });
    
    const userid = req.body.input.userid;
    const access_key = req.body.input.access_key;
    
    //auth keycloak
    await kcAdminClient.auth({
      username: process.env.KEYCLOAK_USER || "keycloak",
      password: process.env.KEYCLOAK_PW,
      //password: 'admin',
      grantType: "password",
      clientId: "admin-cli",
    });
    kcAdminClient.setConfig({
      realmName: "edu-hub",
    });
    
    //get user by id
    let user = await kcAdminClient.users.findOne({ id: userid });
    const client = createClient({
      //endpoint: 'http://localhost:8080/v1/graphql',
      endpoint: process.env.HASURA_ENDPOINT,
      headers: {
        "x-access-key": process.env.HASURA_ADMIN_SECRET,
        "X-Hasura-Role": "admin",
        "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET,
      },
    });
    
    //get hasura client from keycloak
    const hasura_client = await kcAdminClient.clients.find({
      clientId: 'hasura',
      first: 1,
    });
    
    //get hasura client roles for user
    const roles = await kcAdminClient.users.listClientRoleMappings({
      id: userid,
      clientUniqueId: hasura_client[0].id,
    });
    
    const admin_role = roles.filter(it => it.name === 'admin')[0];
    const instructor_role = roles.filter(it => it.name === 'instructor')[0];
    console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.log("admin_role");
    console.log(admin_role);
    console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");

    //get user from hasura
    let findUserResponse;
    await client
      .query({
        query: "query($id : uuid!) { User_by_pk(id: $id) { id firstName } }",
        variables: { id: userid },
      })
      .then((response) => {
        findUserResponse = response.data.User_by_pk;
      })
      .catch((error) => console.error(error));
    
    if (user != null) {
      //if user does not exits create it
      if (!findUserResponse || (findUserResponse.length == 0)) {
        await client
          .query({
            query:
              "mutation($id : uuid!, $firstname : String, $lastname : String, $email : String) { insert_User(objects: {id: $id, firstName: $firstname, lastName: $lastname, email: $email}) { returning { id } } }",
            variables: {
              id: userid,
              firstname: user.firstName,
              lastname: user.lastName,
              email: user.email,
            },
          })
          .then((response) => {})
          .catch((error) => console.error(error));
      //if it does exits just do an update
      } else {
        await client
          .query({
            query:
              "mutation($id : uuid!, $firstname : String, $lastname : String, $email : String) { update_User_by_pk(pk_columns: {id: $id}, _set: {firstName: $firstname, lastName: $lastname, email: $email}) { id  } }",
            variables: {
              id: userid,
              firstname: user.firstName,
              lastname: user.lastName,
              email: user.email,
            },
          })
          .then((response) => {})
          .catch((error) => console.error(error));
      }
      
      //if user is supposed to have instructor role check if it has, if not add it
      let findInstructorResponse;
      if (instructor_role != null) { 
        await client
          .query({
            query: "query($id : uuid!) { Expert(where: {userId: {_eq: $id}}) { id } }",
            variables: { id: userid },
          })
          .then((response) => {
            findInstructorResponse = response.data.Expert;
          })
          .catch((error) => console.error(error));
        if (!findinstructorResponse || (findInstructorResponse.length == 0)) {
          await client
          .query({
            query:
              "mutation($id : uuid!) { insert_Expert(objects: {userId: $id}) { returning { id } } }",
            variables: {
              id: userid
            },
          })
          .then((response) => {})
          .catch((error) => console.error(error));
        }
      }
      
      //if user is supposed to have admin role check if it has, if not add it
      let findAdminResponse;
      if (admin_role != null) { 
        await client
          .query({
            query: "query($id : uuid!) { Admin(where: {userId: {_eq: $id}}) { id } }",
            variables: { id: userid },
          })
          .then((response) => {
            findAdminResponse = response.data.Admin;
          })
          .catch((error) => console.error(error));
        if (!findAdminResponse || (findAdminResponse.length == 0)) {
          await client
          .query({
            query:
              "mutation($id : uuid!) { insert_Admin(objects: {userId: $id}) { returning { id } } }",
            variables: {
              id: userid
            },
          })
          .then((response) => {})
          .catch((error) => console.error(error));
        }
      }

      return res.json({
        result: "updateFromKeycloak function finished",
      });
    }
  }
};
