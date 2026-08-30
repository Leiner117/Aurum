function buildSettingsCard() {
  var props = PropertiesService.getUserProperties();

  var section = CardService.newCardSection().setHeader("Aurum Configuration");

  section.addWidget(
    CardService.newTextInput()
      .setFieldName("aurumUrl")
      .setTitle("Aurum App URL")
      .setHint("e.g. https://your-app.vercel.app")
      .setValue(props.getProperty("AURUM_API_URL") || "")
  );

  section.addWidget(
    CardService.newTextInput()
      .setFieldName("apiToken")
      .setTitle("API Token")
      .setHint("Generate one in Aurum → Settings → Gmail Add-on Tokens")
      .setValue(props.getProperty("AURUM_API_TOKEN") || "")
  );

  section.addWidget(
    CardService.newTextButton()
      .setText("Save")
      .setOnClickAction(CardService.newAction().setFunctionName("saveConfig"))
  );

  return CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle("Aurum Settings"))
    .addSection(section)
    .build();
}

function saveConfig(e) {
  var inputs = e.commonEventObject.formInputs;
  var url = inputs.aurumUrl.stringInputs.value[0].replace(/\/$/, "");
  var token = inputs.apiToken.stringInputs.value[0].trim();

  PropertiesService.getUserProperties().setProperties({
    AURUM_API_URL: url,
    AURUM_API_TOKEN: token
  });

  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText("Configuration saved."))
    .build();
}

function todayIso() {
  return Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    "yyyy-MM-dd"
  );
}
