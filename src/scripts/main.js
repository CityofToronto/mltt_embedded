
$(function () {
  let config, cotApp;
  cotApp = new CotApp();
  // @if ENV='local' || ENV='dev'
  console.log('READY - running on env: ', '/* @echo ENV*/');
  // @endif
  //let cotApp = new CotApp();

  //@if ENV='local'
  cotApp.appContentKeySuffix = '';
  //@endif

  cotApp.loadAppContent({
    keys: ["mltt_config", "mltt_terms" , "mltt_terms_decline", "mltt_overview"],
    onComplete: function (data) {
      console.log('loadAppContent Complete');
      let key = "mltt_config";
      //@if ENV='local'
      config = JSON.parse(data[key]);
      //@endif
      //@if ENV!='local'
      config = data[key];
      //@endif
      config.terms = data["mltt_terms"];
      config.terms_decline = data["mltt_terms_decline"];
      config.overview = data["mltt_overview"];
      initialize();
    }
  });

function initialize() {
console.log(config)
  $.get("/* @echo SRC_PATH*//html/mltt.html #fh-steps", function (template) {
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
  console.log('loadFormValidation');
  let refresh = $('#btn_calc_refresh');
  $('#btn_back').click(function () {
    navigatetoStep(1);
  });
  $('#btn_forward').click(function () {
    showSessions();
  });
  $('#btn_calc').click(function () {
    calculateMLTT($('#properyValue').val());
  });
  $('#btn_print').click(function () {
    window.print();
  });
  $("input:radio[name=optradio]").click(function () {
    calculateMLTT($('#properyValue').val());
  });
  refresh.click(function () {
    refreshCalculator();
  });
  $('#btn_back_2').click(function () {
    navigatetoStep(2);
    refreshCalculator();
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
        properyValue: {
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
      $(this).formValidation('revalidateField', 'properyValue');
      e.preventDefault();
    });
}

function refreshCalculator() {
  $('#properyValue').val('').focus();
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
/*
  $.each($("div[data-wcm-title]"), function (i, item) {
    $(item).html(config[$(item).attr("data-wcm-title")]);
  });
  */
  $('#properyValue').keydown(function (e) {
    let key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
    if (key == 13) {
      calculateMLTT($('#properyValue').val());
    }
  });

  CotApp.showTerms({
    termsText: config.terms,
    disagreedText: config.terms_decline,
    containerSelector: '#terms_container',
    agreedCookieName: 'cot-terms-mltt',
    onAgreed: function () {
      termsAgree();
    }
  });
}

function termsAgree() {

  $("#fh-steps").removeClass("hide");
}

function navigatetoStep(stepNo) {
  let terms = $("#cot-template-terms");
  switch (stepNo) {
    case 1:
      $.removeCookie("cot-terms-mltt", {path: '/'});
      $("#fh-steps").addClass("hide");
      if (terms.length > 0) {
        terms.removeClass("hide");
      } else {
        showTerms();
      }
      break;
    case 2:
      $("#fh-step2").addClass("hide");
      $("#fh-step1").removeClass("hide");
      break;
    default:
  }
}
});
