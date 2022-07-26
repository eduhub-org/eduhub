const express = require("express");
const bodyParser = require("body-parser");
const KcAdminClient = require('@keycloak/keycloak-admin-client').default;

const app = express();

const PORT = process.env.PORT || 3000;

const { createClient } = require('graphqurl');

app.use(bodyParser.json());

exports.updateFromKeycloak = async (req, res) => {
   
   if (process.env.HASURA_CLOUD_FUNCTION_SECRET == req.headers.secret) {
    
    const kcAdminClient = new KcAdminClient({
       baseUrl: process.env.KEYCLOAK_URL,
       //baseUrl: 'http://0.0.0.0:28080',
       realmName: 'master',
    });
    
    const userid = req.body.input.userid;
    const access_key = req.body.input.access_key;
    
    await kcAdminClient.auth({
      username: 'keycloak',
      password: process.env.KEYCLOAK_PW,
      //password: 'admin',
      grantType: 'password',
      clientId: 'admin-cli'
    });
    kcAdminClient.setConfig({
      realmName: 'edu-hub',
    });
    let user = (await kcAdminClient.users.findOne({id: userid}));
    const client = createClient({
      //endpoint: 'http://localhost:8080/v1/graphql',
      endpoint: process.env.HASURA_ENDPOINT,
      headers: {
        'x-access-key': access_key,
        'X-Hasura-Role' : 'admin',
        'x-hasura-admin-secret' : access_key
      },
    });
    
    
    let findUserResponse;
    await client.query(
      {
        query: 'query($id : uuid!) { User_by_pk(id: $id) { id firstName } }',
        variables: {id: userid}
      },
    ).then((response) => {
      findUserResponse = response.data.User_by_pk;
    }).catch((error) => console.error(error));

    if (user != null) {
      console.log("kc user exists");
      if (findUserResponse == null) {
        console.log("no hasura user exists");
        await client.query(
          {
            query: 'mutation($id : uuid!, $firstname : String, $lastname : String, $email : String) { insert_User(objects: {id: $id, firstName: $firstname, lastName: $lastname, email: $email}) { returning { id } } }',
            variables: {id: userid, firstname: user.firstName, lastname: user.lastName, email: user.email}
          },
        ).then((response) => {
          console.log(response);
        }).catch((error) => console.error(error));
      } else {
        console.log("hasura user exists");
        console.log(user)
        await client.query(
          {
            query: 'mutation($id : uuid!, $firstname : String, $lastname : String, $email : String) { update_User_by_pk(pk_columns: {id: $id}, _set: {firstName: $firstname, lastName: $lastname, email: $email}) { id  } }',
            variables: {id: userid, firstname: user.firstName, lastname: user.lastName, email: user.email}
          },
        ).then((response) => {
          console.log(response);
        }).catch((error) => console.error(error));
      }
      
      return res.json({
        
      });
    }
  }
};
