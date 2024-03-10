/* ########## DATA MODEL #################################################### */
/* Globals */
var chartData = null;                  /* Initial Chart Data Set (via fetch)  */
var digestDataSet = new Array();       /* Chart Data Set with ++ derived info */
var digestDataSummary = new Object();  /* Chart Data Summary (++ info)        */

/* Determine the Day (the way the JSON format records it) */
const dataDays = ["sun","mon","tue","wed","thu","fri","sat"];
const todayDate = new Date();
const todayDay = dataDays[todayDate.getDay()];

/* Fetch Chart Data */
async function getChartData(chartDataURL) {
    let emptyChartData = [ 
        {"day": "mon", "amount": 0 },
        {"day": "tue", "amount": 0 },
        {"day": "wed", "amount": 0 },
        {"day": "thu", "amount": 0 },
        {"day": "fri", "amount": 0 },
        {"day": "sat", "amount": 0 },
        {"day": "sun", "amount": 0 }
    ];
    try {
        /* Fetch Chart data */
        const response = await fetch(chartDataURL);
        if (response.ok) {
            chartData = await response.json();
            console.log("Chart Data Received", response);
        } else {
            chartData = emptyChartData;
            console.error("Error fetching Chart Data. Using placeholder data set.", response);
        }
    } catch (error) {
        chartData = emptyChartData;
        console.error(`Error fetching Chart Data. Using placeholder data set. : ${error.message}`);
    }
} /* getChartData() */

/* Build the Digested Data Set (provides additional info all in one place) */
function processChartData(chartData) {
    /* Determine Maximum amount and day */
    let maxChartAmount = 0.00;
    let maxChartIndex = 0;
    let minChartAmount = 0;
    let minmaxChartGap = 0;
    for(var i=0; i < chartData.length; i++) {
        if (chartData[i].amount > maxChartAmount) {
            maxChartIndex = i;
            maxChartAmount = chartData[i].amount;
        }
        if (i == 0) { minChartAmount = chartData[i].amount };
        if ( chartData[i].amount < minChartAmount) {
            minChartAmount = chartData[i].amount;
        }
        minmaxChartGap = maxChartAmount - minChartAmount;
    }
    digestDataSummary = {
        "maximum": maxChartAmount,
        "miniumum": minChartAmount,
        "minmaxgap": minmaxChartGap,
        "maxindex": maxChartIndex,
    };

    /* Derive per-Day details */
    for (var i=0; i < chartData.length; i++)
    {
        let barheightpercent = ((chartData[i].amount / digestDataSummary.maximum ) * 100) . toFixed(2);;
        digestDataSet[i] = {
            "day": chartData[i].day,
            "amount": chartData[i].amount,
            "barheightpercent": parseFloat(
                ( ( chartData[i].amount / digestDataSummary.maximum ) * 100 )
                .toFixed(2) ),
            "tooloffsetpercent": 100 - barheightpercent
        };
    }
} /* processChartData() */

/* ########## DOCUMENT OBJECT MODEL ######################################### */
function renderChartData(chartData) {
    const domChartValues = document.getElementById("chart-values");
    const domChartPlot = document.getElementById("chart-plot");
    const domChartDays = document.getElementById("chart-days");

    let chartMaxHeight = domChartPlot.getBoundingClientRect().height;

    /* Populate Chart Bar Values (Tooltips) */
    for(var i = 0; i < digestDataSet.length; i++) {
        let valueSpan = document.createElement("span");
        valueSpan.setAttribute("id", `chart-value_${i}`);
        valueSpan.classList.add("chartbar-value");
        valueSpan.classList.add("hidden");
        valueSpan.style.cssText += `translate: 0 ${(chartMaxHeight/100) * digestDataSet[i].tooloffsetpercent}px;`;
        valueSpan.innerHTML = digestDataSet[i].amount;
        domChartValues.appendChild(valueSpan);
    }

    /* Populate Chart Plot (Bars) */
    for(var i = 0; i < digestDataSet.length; i++) {
        /* HTML structure for each bar */    
        /* <span> <svg> <rect /> </svg> </span>
        */
        let svgns = "http://www.w3.org/2000/svg";

        /* Create a Rectangle Shape Object */
        let barSvgRect = document.createElementNS(svgns,"rect");
        barSvgRect.setAttribute("id", `chart-bar-rect_${i}`);
        barSvgRect.setAttribute("width", "100%");
        barSvgRect.setAttribute("height","100%");
        barSvgRect.setAttribute("rx","3");
        barSvgRect.setAttribute("ry", "3");

        /* Create an SVG Object to wrap the rectangle in */
        let barSvg = document.createElementNS(svgns,"svg");
        barSvg.setAttribute("id", `chart-bar-svg_${i}`);
        barSvg.setAttribute("width", "100%");
        barSvg.setAttribute("height", `${digestDataSet[i].barheightpercent}%`);
        barSvg.setAttribute("xmlns", `${svgns}`);

        /* Create the span element that will contain the SVG */
        let svgSpan = document.createElement("span");
        svgSpan.setAttribute("id", `chart-bar_${i}`);
        svgSpan.classList.add("chart-bar");
        if ( digestDataSet[i].day == todayDay ) {
            svgSpan.classList.add("chart-bar-highlighted");
        } else {
            svgSpan.classList.add("chart-bar-regular");
        }

        /* Show/Hide Chart Bar Values (Tooltips)*/
        barSvgRect.addEventListener("mouseover",  (E) => { showChartValue(E); });
        barSvgRect.addEventListener("mouseout",   (E) => { hideChartValue(E); });
        barSvgRect.addEventListener("touchstart", (E) => { hideAllChartValues(); showChartValue(E); });
        barSvgRect.addEventListener("touchend", (E) => { hideAllChartValues(); });

        /* Pull it all together */
        barSvg.appendChild(barSvgRect);
        svgSpan.appendChild(barSvg);
        domChartPlot.appendChild(svgSpan);
    }

    /* Populate Chart X-Axis (Days) */
    for(var i = 0; i < digestDataSet.length; i++) {
        let svgSpan = document.createElement("span");
        svgSpan.classList.add("chart-day");
        svgSpan.textContent = digestDataSet[i].day;
        domChartDays.appendChild(svgSpan);
    }
} /* renderChartData(); */

/* ########## EVENT HANDLERS ################################################ */
function hideChartValue(Event) {
    let eventTargetArray = Event.target.id.split('_');
    let gridTarget = document.getElementById(`chart-value_${eventTargetArray[1]}`);
    gridTarget.classList.add("hidden");
}
function showChartValue(Event) {
    let eventTargetArray = Event.target.id.split('_');
    let gridTarget = document.getElementById(`chart-value_${eventTargetArray[1]}`);
    gridTarget.classList.remove("hidden");
}

function hideAllChartValues() {
    let gridTargets = document.querySelectorAll(".chartbar-value");
    gridTargets.forEach( (gridTarget) => {
        if (! gridTarget.classList.contains("hidden")) {
            gridTarget.classList.add("hidden");
        }
    } );
}

window.onload = async function () { 
    await getChartData("data.json");
    processChartData(chartData);
    renderChartData(chartData);
}