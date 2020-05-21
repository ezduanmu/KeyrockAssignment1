/*                                                                          */
/*                                                                          */
/*                                                                          */
/*                                TASK 1                                    */
/*                                                                          */
/*                                START                                     */
/*                                                                          */
/*                                                                          */


/*                                                                          */
/*                          Initialize Instructions                         */
/*                                                                          */
function Instruction(side,
                     name,
                     ticker,
                     targetPercentNAV, // In decimal
                     currency,
                     limit) // In local currency
{
    this.side = side;
    this.name = name;
    this.ticker = ticker;
    this.targetPercentNAV = targetPercentNAV;
    this.currency = currency;
    this.limit = limit;

}

// - Sell short Samsung, 005930 KS, to -4% of NAV, limit KRW 51,000
// - Buy Cover Apple, AAPL US, to 0% of NAV, limit USD 265
// - Buy Embraer, EMBR3 SA, to 8% of NAV, limit BRL 9
// - Buy Boeing, BA US, to 8% of NAV, limit USD 175
// - Sell Airbus, AIR FP, to 4% of NAV, limit EUR 52
var instructions = [];
instructions.push(new Instruction("sell short", "Samsung", "005930 KS", -0.04, "KRW", 51000));
instructions.push(new Instruction("buy cover", "Apple", "AAPL US", 0, "USD", 265));
instructions.push(new Instruction("buy", "Embraer", "EMBR3 BZ", 0.08, "BRL", 9));
instructions.push(new Instruction("buy", "Boeing", "BA US", 0.08, "USD", 175));
instructions.push(new Instruction("sell", "Airbus", "AIR FP", 0.04, "EUR", 52));


/*                                                                          */
/*                         Process .csv of positions                        */
/*                                                                          */
function Position(p)
{
    this.ticker = p[0];
    this.name = p[1];
    this.currency = p[2];
    this.FXrate = parseFloat(p[3]);
    this.position = parseFloat(p[4]);
    this.exposureNAV = parseFloat(p[5]) / 100;
    this.exposureGross = parseFloat(p[6]);
    this.exposureNet = parseFloat(p[7]);
    this.fundNAVbase = parseFloat(p[8]);
    this.EODPX = parseFloat(p[9]);
    this.stdPxChange = parseFloat(p[10]) / 100;
    this.custodian = p[11];
}

var positions = []; // Array of positions read from inputted .csv

function processPositions() 
{
    var file = document.querySelector("#fileInput1").files[0];
    if (file) {
        var reader = new FileReader();
        reader.readAsText(file);
        reader.onload = function(event) {
            var csv = event.target.result;
            var rows = csv.split("\n");
            for (var i = 1; i < rows.length - 1; i++) { // Skips first (header) row and last (total) row
                var currRow = rows[i].split(",");
                var currPos = new Position(currRow);
                positions.push(currPos);
            }
            download("split_orders.csv", createSplitOrdersCSV());
        }        
    }
}


/*                                                                          */
/*                           Create split orders                            */
/*                                                                          */
function SplitOrder(instr, pos, quantity, limit) // (instruction, position)  
{
    this.currency = pos.currency;
    this.side = instr.side;
    this.ticker = instr.ticker;
    this.name = instr.name;
    this.quantity = quantity;
    this.limit = limit; // TO DO: convert to USD?
    this.custodian = pos.custodian;
}

// input: instructions and positions
// output: array of all split orders
function splitOrdersArray() // (instructions[], positions[])  
{
    var splitOrders = [];
    for (var i = 0; i < instructions.length; i++) {
        var currSplitOrders = splitOrdersFromInstruction(instructions[i]);
        for (var j = 0; j < currSplitOrders.length; j++) {
            splitOrders.push(currSplitOrders[j]);
        }
    }
    return splitOrders;
}

// input: one instruction
// output: array of four split orders from inputted instruction
function splitOrdersFromInstruction(instr)
{
    var relPos = positions.find(element => element.ticker == instr.ticker); // Relevant position
    var targetPercentGap = Math.abs(instr.targetPercentNAV - relPos.exposureNAV);
    var limit = instr.limit;
    var stdDev = relPos.stdPxChange;
    var FXrate = relPos.FXrate;

    var arr = [];

    var totalQuantity = 0;
    if (instr.targetPercentNAV == 0) {
        totalQuantity = Math.abs(relPos.position);
    } else {
        totalQuantity = (targetPercentGap * relPos.fundNAVbase) / splitPriceLevel(limit, stdDev, 3);  // quantity = (targetPercentNAV * NAV)/ limit
    }
    
    for (var i = 0; i < 4; i++) {
        arr.push(new SplitOrder(instr,                               // instruction
                                relPos,                              // relevant position
                                (i + 1) * 0.1 * totalQuantity,       // percentage of quantity (QUESTION:  ACCOUNT FOR ROUNDING ERRORS?)
                                //FXtoUSD(splitPriceLevel(limit, stdDev, i), FXrate)));   // split limit (USD)
                                splitPriceLevel(limit, stdDev, i), FXrate));
    }

    return arr;
}

// Split price level helper function
function splitPriceLevel(origPrice, stdDev, power)
{
    return origPrice * Math.pow(1 - stdDev, power);
}

// Foreign exchange helper function
// function FXtoUSD(val, FXrate)
// {
//     return val / FXrate;
// }


/*                                                                          */
/*                         Create output .csv text                          */
/*                                                                          */
function createSplitOrdersCSV() 
{
    var text = "Trade Side,Security Name,Security Ticker,Quantity,Currency,Limit,Custodian\n";

    var splitOrders = splitOrdersArray();
    for (var i = 0; i < splitOrders.length; i++) {
        text += splitOrderToText(splitOrders[i]);
    }

    console.log("Text to be outputted: " + text);
    
    return text;
}

function splitOrderToText(s)
{
    return "" + s.side + "," + s.name + "," + s.ticker + "," + Math.floor(s.quantity) + "," + s.currency + "," + s.limit.toFixed(2) + "," + s.custodian + "\n";
}


/*                                                                          */
/*                                                                          */
/*                                                                          */
/*                                TASK 1                                    */
/*                                                                          */
/*                                 END                                      */
/*                                                                          */
/*                                                                          */




/*                                                                          */
/*           Create .csv to be downloaded (used for both tasks)             */
/*                                                                          */
function download(filename, text) 
{
    var element = document.createElement('a');
    element.href = 'data:text/csv;charset=utf-8,' + encodeURI(text);
    element.download = filename;
    element.click();
    element.remove();
}





/*                                                                          */
/*                                                                          */
/*                                                                          */
/*                                TASK 2                                    */
/*                                                                          */
/*                                START                                     */
/*                                                                          */
/*                                                                          */


//ID	Broker	Ticker	Side	Executed Quantity	Avg. Price	Custodian
function Execution(e)
{
    this.id = e[0];
    this.broker = e[1];
    this.ticker = e[2];
    this.side = e[3];
    this.quantity = parseFloat(e[4]);
    this.avgPrice = parseFloat(e[5]);
    this.custodian = e[6];
}

var executions = [];

function Summary(e)
{
    this.ticker = e.ticker;
    this.side = e.side;
    this.custodian = e.custodian;
    this.broker = e.broker;
    this.quantity = 0;
    this.totalPrice = 0;
    this.avgPrice = 0;
}


function summarizeExecutions()
{
    var file = document.querySelector("#fileInput2").files[0];
    if (file) {
        var reader = new FileReader();
        reader.readAsText(file);
        reader.onload = function(event) {
            var csv = event.target.result;
            var rows = csv.split("\n");
            for (var i = 1; i < rows.length; i++) { // Skips first (header) row
                var currRow = rows[i].split(",");
                var currPos = new Execution(currRow);
                executions.push(currPos);
            }
            download("executions_summary.csv", createSummaryCSV());
        }        
    }
}

function createSummaryCSV()
{
    var text = "Ticker,Side,Executed Quantity,Average Price,Custodian,Broker\n";
    var summaries = executionSummaries();
    for (var i = 0; i < summaries.length; i++) {
        text += summaryToText(summaries[i]);
    }

    console.log("Text to be outputted: " + text);
    
    return text;

}

// output: array of summaries for each security
function executionSummaries()
{
    var summaries = [];

    for (var i = 0; i < executions.length; i++) {
        var currExec = executions[i];
        var securityExists = false;
        for (var j = 0; j < summaries.length; j++) {
            if (summaries[j].ticker == currExec.ticker) {
                securityExists = true;
                summaries[j].quantity += currExec.quantity;
                summaries[j].totalPrice += currExec.quantity * currExec.avgPrice;
                break;
            }
        }
        if (!securityExists) {
            summaries.push(new Summary(currExec));
            var lastIdx = summaries.length - 1;
            summaries[lastIdx].quantity += currExec.quantity;
            summaries[lastIdx].totalPrice += currExec.quantity * currExec.avgPrice;
        }
    }

    for (var i = 0; i < summaries.length; i++) {
        summaries[i].avgPrice = summaries[i].totalPrice / summaries[i].quantity;
    }

    return summaries;
}


function summaryToText(s)
{
    // s.custodian.replace('\r','') fixes the error where there is an extra \r character from custodian cell
    return "" + s.ticker + "," + s.side + "," + s.quantity + "," + Math.floor(s.avgPrice) + "," + s.custodian.replace('\r','') + "," + s.broker + "\r\n";
}

/*                                                                          */
/*                                                                          */
/*                                                                          */
/*                                TASK 2                                    */
/*                                                                          */
/*                                 END                                      */
/*                                                                          */
/*                                                                          */