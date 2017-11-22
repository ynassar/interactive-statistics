
var CUTOFF_CDF_VALUE = 0.99;
var PRECISION = 2;
var X_STEP = Math.pow(10, -PRECISION);
var SELECT_PRECISION = 2;
var SELECT_STEP = Math.pow(10, -SELECT_PRECISION);

var chart;
var data_points;
var nulls;
var old_selected_low = null, old_selected_high = null;
var click_detected = false;
var clamp_select_idx = function(select_idx){
    select_idx = Math.max(select_idx, 0);
    select_idx = Math.min(select_idx, nulls.length - 1);
    return select_idx;
}
var clamp_x_value = function(x_value){
    x_value = Math.max(x_value, 0);
    x_value = Math.min(x_value, data_points[data_points.length - 1][0]);
    return x_value;
}
var handle_selection = function(low, high){ 
    low = clamp_x_value(low);
    high = clamp_x_value(high);
    var low_idx = Math.round(low * Math.pow(10, SELECT_PRECISION));
    var high_idx = Math.round(high * Math.pow(10, SELECT_PRECISION));
    low_idx = clamp_select_idx(low_idx);
    high_idx = clamp_select_idx(high_idx);

    if(old_selected_low != null){
        chart.series[1].setData(nulls);
    }

    var new_vals = [];
    var x = 0;
    for (var i = 0; i < nulls.length; i ++){
        new_vals.push([x, null]);
        x += SELECT_STEP;
    }

    for (var i = low_idx; i <= high_idx; i++){
        new_vals[i] = true_vals[i];
    }

    chart.series[1].setData(new_vals);

    old_selected_low = low_idx;
    old_selected_high = high_idx;

    document.getElementById("a-input").value = low;
    document.getElementById("b-input").value = high;
    var math = MathJax.Hub.getAllJax("probability-output")[0];
    if (math != null)
        MathJax.Hub.Queue(["Text",math, "P(" + low.toString() + " < F" + "_{ " + df1.toString() + ", "+df2.toString() + "}" + "< " + high.toString() + ") \\approx " + (jStat.centralF.cdf(high, df1, df2) - jStat.centralF.cdf(low, df1, df2)).toString()]);
}

var generate_chart = function(){
    old_selected_high = old_selected_low = null;
    data_points = [];
    nulls = [];
    var x = 0;
    df1 = parseInt(document.getElementById("df1-input").value);
    df2 = parseInt(document.getElementById("df2-input").value);

    var math = MathJax.Hub.getAllJax("probability-output")[0];
    if (math != null)
        MathJax.Hub.Queue(["Text",math, "P(a < F" + "_{" + df1.toString() + ", " + df2.toString() + "} < b) \\approx"]);

    var y = jStat.centralF.pdf(x, df1, df2);
    var increased_sufficiently = false;
    while(jStat.centralF.cdf(x, df1, df2) < CUTOFF_CDF_VALUE){
        data_points.push([x,y]);
        x += X_STEP;
        x = +(x.toFixed(PRECISION));
        y = jStat.centralF.pdf(x, df1, df2);
    }

    var x = 0;
    var y = jStat.centralF.pdf(x, df1, df1);
    true_vals = [];
    var increased_sufficiently = false;
    while(jStat.centralF.cdf(x, df1, df2) < CUTOFF_CDF_VALUE){
        nulls.push([x, null]);
        true_vals.push([x,y]);
        x += SELECT_STEP;
        x = +(x.toFixed(SELECT_PRECISION));
        y = jStat.centralF.pdf(x, df1, df2);
    }


    chart = new Highcharts.Chart({
        chart: {
            renderTo: 'plotarea',
            type: 'areaspline',
            events: {
                selection : function(event_data){
                    var low = +(event_data.xAxis[0].min.toFixed(PRECISION));
                    var high = +(event_data.xAxis[0].max.toFixed(PRECISION));
                    handle_selection(low, high);
                    return false;
                },
                click: function(event_data){
                    if(click_detected){
                        var low = 0;
                        var high = +(event_data.xAxis[0].value.toFixed(PRECISION))                
                        handle_selection(low, high);
                        click_detected = false;
                    }
                    else{
                        click_detected = true;
                        setTimeout(function(){
                            click_detected = false;
                        }, 100);
                    }
                }
            },

            zoomType : 'x',
        },
        title: {
            text: 'The F distribution'
        },
        xAxis: {
            labels: {
                formatter: function() {
                    return this.value;
                }
            }
        },
        yAxis: {
            title: {
                text : '',
            }
        },
        plotOptions: {
            area: {
                pointStart: 1940,
                marker: {
                    enabled: false,
                    symbol: 'circle',
                    radius: 2,
                    states: {
                        hover: {
                            enabled: true
                        }
                    }
                }
            },
            series:{
                marker:{
                    enabled:false
                }
            },
        },
        series: [{
            name : 'f(x)',
            data: data_points,
            showInLegend : false
        },{
            name: 'f(x)',
            data: nulls,
            showInLegend : false
        }]
    });
}


$(document).ready(function() {
    $("#generate-graph-button").on("click", function(){
        chart.destroy();
        generate_chart();
    });

    $("#a-input").change(function(){
        var a = parseFloat(document.getElementById("a-input").value);
        var b = parseFloat(document.getElementById("b-input").value);
        if(a <= b){
            handle_selection(a,b);
        }
    });
    
    $("#b-input").change(function(){
        var a = parseFloat(document.getElementById("a-input").value);
        var b = parseFloat(document.getElementById("b-input").value);
        if(a <= b){
            handle_selection(a,b);
        }
    });

    MathJax.Hub.Queue(["Typeset", MathJax.Hub]);

    generate_chart();
});

