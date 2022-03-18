const KcAdminClient = require('@keycloak/keycloak-admin-client');
const bodyParser = require("body-parser");

exports.updateKeycloakProfile = async (req, res) => {
   if (process.env.HASURA_CLOUD_FUNCTION_SECRET == req.headers.secret) {
    
    const kcAdminClient = new KcAdminClient({
       baseUrl: process.env.KEYCLOAK_URL,
       realmName: 'master',
    });
    
    const firstName = req.body.event.data.new.firstName;
    const lastName = req.body.event.data.new.lastName;
    const email = req.body.event.data.new.email;
    const userid = req.body.event.data.new.id;
    
    await kcAdminClient.auth({
      username: 'admin',
      password: process.env.KEYCLOAK_PW,
      grantType: 'password',
      clientId: 'admin-cli'
    });
    
    kcAdminClient.setConfig({
      realmName: 'edu-hub',
    });
    
    console.log(lastName);
    
    await kcAdminClient.users.update(
      {id: userid},
      {
        firstName: firstName,
        lastName: lastName,
        email: email
      },
    );
    
    return res.json({
      
    });
  }
};
