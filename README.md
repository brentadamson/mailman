# Mailman

Mailman is the best mail merge tool for Gmail.:

Q: Why create this when there's like a bazillion Add-ons that do the same thing?

A: Privacy! Mail Merge Add-ons in Google Sheets have a lot of power to read your Sheet and even your Gmail account. By creating our own template system, we don't require access to read your email and thus require fewer permissions than our competitors. While other Add-ons might claim to be privacy-centric, you can never be assured until you see their code.

## :runner: How do I run this?

The easiest way to run Mailman is to install it from the Google Workspace Marketplace: https://workspace.google.com/marketplace/app/appname/77839336908

## :hammer: If, instead, you want to run your own version you will need to setup both the backend API and the Google Sheets parts.

* Clone this repo:

  `git clone https://github.com/brentadamson/mailman.git`


### Backend

* Set your environment variables:

  **IMPORTANT**: The `JWT_SECRET` **MUST** be the same as the `JWT_SECRET` environment variable set below in the `Google Sheets` section.

  ```
  export MAILMAN_POSTGRESQL_USER=user
  export MAILMAN_POSTGRESQL_PASSWORD=mypassword
  export MAILMAN_POSTGRESQL_HOST=localhost
  export MAILMAN_POSTGRESQL_DATABASE=mydatabase
  export MAILMAN_POSTGRESQL_PORT=5432
  export MAILMAN_ENCRYPTION_KEY=my-32-bit-hex-encoded-encryption-key
  export MAILMAN_JWT_SECRET=secret
  ```

* `cd backend/backend/cmd`

* `go run .`

  Your backend service will be listening at `http://127.0.0.1:8000` by default

### Google Sheets

* From the main `mailman` directory:

  `cd googlesheets`

  `npm install`

* Login to [clasp](https://github.com/google/clasp), which lets you manage Apps scripts from the commandline:

  `npm run login`

* Setup a new Sheet and script by running:

  `npm run setup`

  If you already have an existing Sheet and script:

  `npm run setup:use-id <script_id>`

* In your new Sheets script, create a new file called `env.gs` and paste the following code:

  ```
  function updateEnvVariables(){
    PropertiesService.getScriptProperties().setProperty('DOMAIN', 'https://api.example.com');
    PropertiesService.getScriptProperties().setProperty('JWT_SECRET', 'secret');
  }
  ```

  Update the `DOMAIN` and `JWT_SECRET`, select the `updateEnvVariables` in the functions dropdown list and hit the play button.

  **IMPORTANT**: The `JWT_SECRET` **MUST** be the same as the `JWT_SECRET` environment variable set above in the `Backend` section.

  Once that's complete, you can delete the `env.gs` file

* To make changes to the Add-on, enable hot reloading:

  `mkcert -install`

  `npm run setup:https`

  `npm run start`

  Make some changes in the code and see the changes instantly in the Add-on.

  **Note**: changes to `Code.js` will require a restart.

* To deploy:

  `npm run deploy`

### To contribute

Before you do anything, please open up an issue or assign yourself an existing one. This helps coordinate things.
