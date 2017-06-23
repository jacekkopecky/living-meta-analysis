gemini.suite('basics', (suite) => {

  suite.setUrl('/')
    .setCaptureElements('body')
    .capture('invite-page')

    .capture('home', function (actions, find) {
      actions.sendKeys(find('#invitecode'), '1');
      actions.sendKeys(gemini.RETURN);
    });

  gemini.suite('401', (suite) => {
    suite.setUrl('/401')
      .setCaptureElements('body')
      .capture('plain')
  });

  gemini.suite('404', (suite) => {
    suite.setUrl('/404')
      .setCaptureElements('body')
      .capture('plain')
  });

  gemini.suite('apifail', (suite) => {
    suite.setUrl('/apifail')
      .setCaptureElements('body')
      .capture('plain')
  });

  gemini.suite('profile (when not logged in)', (suite) => {
    suite.setUrl('/profile')
      .setCaptureElements('body')
      .capture('plain')
  });

  gemini.suite('local user profile (when not logged in)', (suite) => {
    suite.setUrl('/local')
      .setCaptureElements('body')
      .capture('plain')
  });

  // attempt to log in, put email and password in below
  // WE HIT 2FACTOR AUTH - MAY BE AVOIDABLE
  // gemini.suite('log in', (suite) => {
  //   suite.setUrl('https://accounts.google.com/signin/v2/identifier?hl=en')
  //     .setCaptureElements('body')
  //     .capture('plain', function (actions, find) {
  //       actions.sendKeys(find('#identifierId'), '>>>>>>> emailgoeshere <<<<<<<<<<')
  //         .sendKeys(gemini.RETURN)
  //         .wait(1000)
  //         .sendKeys(">>>>>>> passwordgoeshere <<<<<<<<<<")
  //         .sendKeys(gemini.RETURN)
  //     });
  //
  //   the logged-in tests would have to be sub-suites here
  //
  // });
});
