
$(function () {
  let config, cotApp, keys= ["mltt_config", "mltt_terms" , "mltt_terms_decline", "mltt_overview"];
  cotApp = new CotApp();
  // @if ENV='local' || ENV='dev'
  console.log('READY - running on env: ', '/* @echo ENV*/');
  // @endif
  //let cotApp = new CotApp();

  //@if ENV='local'
  cotApp.appContentKeySuffix = '';
  //@endif

  cotApp.loadAppContent({
    keys: keys,
    onComplete: function (data) {

      //@if ENV='local'
      config = JSON.parse(data[keys[0]]);
      //@endif
      //@if ENV!='local'
      config = data[keys[0]];
      //@endif
      config.terms = data[keys[1]];
      config.terms_decline = data[keys[2]];
      config.overview = data[keys[3]];
      initialize();
    }
  });

function initialize() {
  $.get("/* @echo SRC_PATH*//html/mltt.html#fh-steps", function (template) {
    let rendered = Mustache.render(template, config);
    //console.log(rendered)
    $("#view_container").empty().html(rendered);
    loadFormValidation();
    showTerms();
    $(".fv-hidden-submit").addClass(".hidden").text("system button");
  }).fail(function () {
    $("#view_container").empty();
  });
}

function loadFormValidation() {
/*
  let refresh = $('#btn_calc_refresh');
  $('#btn_back').click(function () {navigatetoStep(1);});
  $('#btn_forward').click(function () {showSessions();});
  $('#btn_calc').click(function () {calculateMLTT($('#properyValue').val());});
  $('#btn_print').click(function () {window.print();});
  $("input:radio[name=optradio]").click(function () {calculateMLTT($('#properyValue').val());});
  refresh.click(function () {refreshCalculator();});
  $('#btn_back_2').click(function () {navigatetoStep(2);refreshCalculator();});
*/

  $("#view_container")
    .off("click", "#btn_back").on("click","#btn_back", function(){navigatetoStep(1);})
    .off("click", "#btn_back_2").on("click","#btn_back_2", function(){navigatetoStep(2);refreshCalculator();})
    .off("click", "#btn_forward").on("click","#btn_forward", function(){showSessions();})
    .off("click", "#btn_calc").on("click","#btn_calc", function(){calculateMLTT($('#propertyValue').val());})
    .off("click", "input:radio[name=optradio]").on("click","input:radio[name=optradio]", function(){calculateMLTT($('#propertyValue').val());})
    .off("click", "#btn_print").on("click","#btn_print", function(){window.print();})
    .off("click", "#btn_calc_refresh").on("click","#btn_calc_refresh", function(){navigatetoStep(2);refreshCalculator();})
    .off("keyup", "#propertyValue").on("keyup","#propertyValue", function (event) {
    if (event.keyCode === 13) {
      $("#btn_calc").click();
    }
  });

  $('#numericForm')
    .formValidation({
      framework: 'bootstrap',
      icon: {
        valid: 'glyphicon glyphicon-ok',
        invalid: 'glyphicon glyphicon-remove',
        validating: 'glyphicon glyphicon-refresh'
      },
      fields: {
        propertyValue: {
          validators: {
            greaterThan: {
              value: 1,
              message: 'The value must be greater than 1'
            },
            numeric: {
              message: 'The value is not a number',
              // The default separators
              thousandsSeparator: '',
              decimalSeparator: '.'
            },
            notEmpty: {message: "Value of Consideration is required"}
          }
        }
      }
    })
    .submit(function (e) {
      $(this).formValidation('revalidateField', 'propertyValue');
      e.preventDefault();
    });
}

function refreshCalculator() {
  $('#propertyValue').val('').focus();
  $('#calcArea').html('');
}

function processCalculations(strValue, category) {
    let singleRate = null;
    let singleCalc = "";
    let val = parseFloat(strValue);
    let html = "";
    if ($.isNumeric(val)) {
      $.each(config["calculation"][category].range, function (i, item) {
        if (i == 'final' && val > item.low) {
          item.range = val - item.low;
          item.sub = (val - item.low) * item.rate;
        }
        else if (val > item.high) {
          //value is greater than the max in this range so apply rate to entire range
          item.range = item.high - item.low;
          item.sub = (item.high - item.low) * item.rate;
        }
        else if (val > item.low && val <= item.high) {
          //value falls in this range to calculate the amount of the value in this range and apply rate
          item.range = val - item.low;
          item.sub = (val - item.low ) * item.rate
        }
        else {
          //value is lower then the low range so 0
          item.sub = 0;
        }
        item.sub = item.sub < 0 ? 0 : item.sub;
        singleRate += item.sub
      });

      $.each(config["calculation"][category].range, function (i, item) {
        if (i == 'first') {
          singleCalc += "<tr><td>" + formatAsCurrency(item.low) + "&nbsp;to&nbsp;" + (val < item.high ? formatAsCurrency(val) : formatAsCurrency(item.high)) + "</td><td style=\"text-align:right\">" + formatAsCurrency(item.range) + "&nbsp;*&nbsp;" + (item.rate * 100).toPrecision(1) + "%&nbsp;=&nbsp;" + formatAsCurrency(item.sub) + "</td></tr>";
        }
        else if (i == 'final' && item.sub > 0) {
          singleCalc += "<tr><td>$" + item.low.toFixed(2) + "&nbsp;to&nbsp;$" + val.toFixed(2) + "</td><td style=\"text-align:right\">" + formatAsCurrency(item.range) + "&nbsp;*&nbsp;" + (item.rate * 100).toPrecision(2) + "%&nbsp;=&nbsp;" + formatAsCurrency(item.sub) + "</td></tr>";
        }
        else if (item.sub > 0 && val < item.high) {
          singleCalc += "<tr><td>$" + item.low.toFixed(2) + "&nbsp;to&nbsp;$" + val.toFixed(2) + "</td><td style=\"text-align:right\">" + formatAsCurrency(item.range) + "&nbsp;*&nbsp;" + (item.rate * 100).toPrecision(2) + "%&nbsp;=&nbsp;" + formatAsCurrency(item.sub) + "</td></tr>";
        }
        else if (item.sub > 0) {
          singleCalc += "<tr><td>$" + item.low.toFixed(2) + "&nbsp;to&nbsp;$" + item.high.toFixed(2) + "</td><td style=\"text-align:right\">" + formatAsCurrency(item.range) + "&nbsp;*&nbsp;" + (item.rate * 100).toPrecision(2) + "%&nbsp;=&nbsp;" + formatAsCurrency(item.sub) + "</td></tr>";
        }
      });
    }

    html += "<h3>" + config[category] + formatAsCurrency(val) + "</h3>";
    //html+="<div class=\"table-responsive\"><table class=\"table table-striped table-bordered\" border=\"0\"><tbody><tr><th>MLTT Rate</th><th style=\"text-align:right\">Calculation</th></tr>";
    html += `<div class="table-responsive">
          <table class="table table-striped table-bordered" border="0">
            <tbody>
              <tr>
                <th>MLTT Rate</th><th style="text-align:right">Calculation</th>
              </tr>`;
    html += singleCalc;
    html += `<tr>
                <td style="text-align: right;" colspan="2"><b>Total MLTT= ` + formatAsCurrency(singleRate) + `</b></td>
             </tr>
           </tbody>
         </table>
       </div>`;
    html += config[category + "Link"];
    return html;

  }

  function formatAsCurrency(val) {
    return '$' + val.toFixed(2).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
  }

  function calculateMLTT(strValue) {
    let val = parseFloat(strValue);
    if ($.isNumeric(val)) {
      let displayType = $("input:radio[name=optradio]:checked").val();
      $("#calcArea").html(processCalculations(strValue, displayType))
    } else {
      //value sent is NAN
      $("#calcArea").html('')
    }
  }

function showSessions() {
  $("#fh-step1, #fh-step3").addClass("hide");
  $("#fh-step2").removeClass("hide");
}

function showTerms() {

  CotApp.showTerms({
    termsText: config.terms,
    disagreedText: config.terms_decline,
    containerSelector: '#terms_container',
    agreedCookieName: 'cot-terms-mltt',
    onAgreed: function () {
      $("#fh-steps").removeClass("hide");
    }
  });
}

function navigatetoStep(stepNo) {
  switch (stepNo) {
    case 1:
      $.removeCookie("cot-terms-mltt");
      $("#fh-steps").addClass("hide");
        showTerms();
      break;
    case 2:
      $("#fh-step2").addClass("hide");
      $("#fh-step1").removeClass("hide");
      break;
    default:
  }
}
});
