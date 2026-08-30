function onGmailMessage(e) {
  var msg = getCurrentMessage(e);
  var from = msg.getFrom();
  var subject = msg.getSubject();
  var body = msg.getPlainBody();
  var parsed = parseTransactionEmail(from, subject, body);
  return buildCard(parsed, subject).build();
}

function getCurrentMessage(e) {
  var id = e.gmail.messageId;
  return GmailApp.getMessageById(id);
}

function buildCard(parsed, fallbackSubject) {
  var card = CardService.newCardBuilder().setHeader(
    CardService.newCardHeader()
      .setTitle("Aurum — Register Transaction")
      .setSubtitle(parsed ? "Transaction detected" : "Fill in manually")
  );

  var section = CardService.newCardSection();

  section.addWidget(
    CardService.newSelectionInput()
      .setType(CardService.SelectionInputType.DROPDOWN)
      .setFieldName("type")
      .setTitle("Type")
      .addItem("Expense", "expense", !parsed || parsed.type === "expense")
      .addItem("Income", "income", parsed && parsed.type === "income")
  );

  section.addWidget(
    CardService.newTextInput()
      .setFieldName("description")
      .setTitle("Description")
      .setValue(parsed ? parsed.description : fallbackSubject.substring(0, 100))
  );

  section.addWidget(
    CardService.newTextInput()
      .setFieldName("amount")
      .setTitle("Amount")
      .setValue(parsed ? String(parsed.amount) : "")
  );

  section.addWidget(
    CardService.newSelectionInput()
      .setType(CardService.SelectionInputType.DROPDOWN)
      .setFieldName("currency")
      .setTitle("Currency")
      .addItem("CRC", "CRC", parsed ? parsed.currency === "CRC" : true)
      .addItem("USD", "USD", parsed ? parsed.currency === "USD" : false)
  );

  section.addWidget(
    CardService.newTextInput()
      .setFieldName("date")
      .setTitle("Date (YYYY-MM-DD)")
      .setValue(parsed ? parsed.date : todayIso())
  );

  section.addWidget(
    CardService.newTextInput()
      .setFieldName("notes")
      .setTitle("Notes (optional)")
      .setMultiline(true)
      .setValue("")
  );

  section.addWidget(
    CardService.newTextButton()
      .setText("Register in Aurum")
      .setOnClickAction(
        CardService.newAction().setFunctionName("submitExpense")
      )
  );

  card.addSection(section);
  return card;
}

function submitExpense(e) {
  var props = PropertiesService.getUserProperties();
  var apiUrl = props.getProperty("AURUM_API_URL");
  var apiToken = props.getProperty("AURUM_API_TOKEN");

  if (!apiUrl || !apiToken) {
    return CardService.newActionResponseBuilder()
      .setNotification(
        CardService.newNotification().setText(
          "Configure Aurum URL and API token in add-on settings first."
        )
      )
      .build();
  }

  var inputs = e.commonEventObject.formInputs;
  var amount = parseFloat(inputs.amount.stringInputs.value[0]);

  if (isNaN(amount) || amount <= 0) {
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText("Invalid amount."))
      .build();
  }

  var payload = {
    amount: amount,
    currency: inputs.currency.stringInputs.value[0],
    description: inputs.description.stringInputs.value[0].substring(0, 100),
    date: inputs.date.stringInputs.value[0],
    type: inputs.type.stringInputs.value[0],
    notes: inputs.notes.stringInputs.value[0] || null,
    category_id: null,
    account_id: null
  };

  var response = UrlFetchApp.fetch(apiUrl + "/api/gmail-addon", {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    headers: { "Authorization": "Bearer " + apiToken },
    muteHttpExceptions: true
  });

  var ok = response.getResponseCode() === 201;
  var message = ok
    ? "Expense registered in Aurum!"
    : "Error " + response.getResponseCode() + ": " + response.getContentText().substring(0, 100);

  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText(message))
    .build();
}
