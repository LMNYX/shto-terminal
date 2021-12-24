var _il;
var _terminal;
var _blockinput;

var UserData;
let _e;
let _p = "";
let _tmpi = "";
var CurrDirectory;

window.onload = async function()
{
    _il = document.getElementById("inputline");
    _terminal = document.getElementById("terminal");
    _blockinput = true;


    await RunInitSequence();
}

async function RunInitSequence()
{
    let _InitRes = await fetch('/terminal/init', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({})
    });
    let _Sequence = await _InitRes.text();

    await eval(_Sequence);
}

document.onkeydown = async function(e)
{
    if(_blockinput)
        return;
    if((/^[A-Za-z0-9_-]+$/.test(event.key) || event.key == '.' )&& event.key.length < 2 || event.key == " ")
        document.getElementById("_i").innerText += event.key;
    switch(event.which)
    {
        case 38:
            _tmpi = document.getElementById("_i").innerText;
            document.getElementById("_i").innerText = _p;
            break;
        case 40:
            if (_tmpi != "")
                document.getElementById("_i").innerText = _tmpi;
            _tmpi = "";
            break;
        case 8:
            document.getElementById("_i").innerText = document.getElementById("_i").innerText.slice(0, -1);
            break;
        case 13:
            _blockinput = true;
            _tmpi = "";
            if(document.getElementById("_i").innerText === null || document.getElementById("_i").innerText.match(/^ *$/) !== null)
            {
                SendOutput(document.getElementById("vm_user").innerHTML+"@"+document.getElementById("vm_machine").innerHTML+":"+document.getElementById("vm_directory").innerHTML+"$ "+document.getElementById("_i").innerText);
                _blockinput = false;
                return;
            }
            const response = await fetch('/terminal/call?_='+`${Math.random()}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({"data": document.getElementById("_i").innerText, "userdata": UserData, "dirdata": CurrDirectory})
              });
            const result = await response.json();
            SendOutput(document.getElementById("vm_user").innerHTML+"@"+document.getElementById("vm_machine").innerHTML+":"+document.getElementById("vm_directory").innerHTML+"$ "+document.getElementById("_i").innerText);
            _p = document.getElementById("_i").innerText;
            document.getElementById("_i").innerText = "";
            if ("pageSwitch" in result)
            {
                let _pgS = await fetch(result['pageSwitch'], {
                    method: 'GET'
                  });
                document.getElementsByClassName("terminal")[0].innerHTML = `Launching ${result['pageSwitch'].split('/')[1]}.sh ...`;
                await sleep(1000);
                await SwitchPage(await _pgS.text());
                window.history.pushState("", "",result['pageSwitch']);
                return;
            }
            if( ("instructions" in result) )
            {
                _blockinput = false;
                ProcessInstructionList(result.instructions);
            }
            if ('eval' in result)
                eval(result['eval']);
            else
                SendOutput(result.fixedText == undefined ? "This method isn't updated to newer versions of REQT yet.\nPlease contact Jonathan@iReallyNeedSome.Rest" : result.fixedText.replaceAll("\n", "<br>"));
            _blockinput = false;
            break;
        default: break;
    }
    document.getElementsByClassName("terminal")[0].scrollTop = document.getElementsByClassName("terminal")[0].scrollHeight;
}

async function SwitchPage(htmldata)
{
    document.onkeydown = null;
    document.documentElement.innerHTML = htmldata;
}
function sleep(ms)
{
    return new Promise(resolve => setTimeout(resolve, ms));
}

function SendOutput(output)
{
    let _temp = document.createElement("ul");
    _temp.innerHTML = output;
    _terminal.insertBefore(_temp, _il);
    document.getElementsByClassName("terminal")[0].scrollTop = document.getElementsByClassName("terminal")[0].scrollHeight;
}

/* DOES NOT DISABLE THE INPUT ITSELF */
function SetInputVisiblity(bl)
{
    _il.style = bl ? "" : "display: none";
}

async function ProcessInstruction(instruction)
{
    let tokens = instruction.split(" ")
    let begin_token = [...tokens][0];
    let token_instructions = [...tokens].slice(1);
    switch(begin_token)
    {
        case "BEGIN":
            break;
        case "END":
            return true;
        case "INPUT":
            switch(token_instructions[0])
            {
                case "HIDE":
                    SetInputVisiblity(false);
                    break;
                case "SHOW":
                    SetInputVisiblity(true);
                    break;
                case "DISABLE":
                    _blockinput = true;
                    break;
                case "ENABLE":
                    _blockinput = false;
                    break;
                case "CLEAR":
                    document.getElementById("_i").innerText = "";
                    break;
                default:
                    throw new InvalidArgumentToken(`Argument token for operation is invalid.`);    
                    break;
            }
            break;
        case "CLEAR":
            switch(token_instructions[0])
            {
                case "SCREEN":
                    document.querySelectorAll("#terminal > ul:not(#inputline)").forEach(x=>x.remove());
                    break;
                case "INPUT":
                    document.getElementById("_i").innerText = "";
                    break;
                default:
                    throw new InvalidArgumentToken(`Argument token for operation is invalid.`);
                    break;
            }
            break;
        case "SLEEP":
            token_instructions[0] = parseInt(token_instructions[0]);
            if (token_instructions[0] == NaN)
            { throw new InvalidArgumentToken("Argument token for operation must be integer."); }
            await sleep(token_instructions[0]);
            break;
        case "MSG":
            let _result = (/MSG ((?:"[^"]*"|^[^"]*$))/.exec(instruction)[1]).split(`"`)[1];
            SendOutput(_result);
            break;
        default:
            throw new InvalidBeginToken(`Token "${begin_token}" is unknown.`);
            break;
    }
    return false;
}

async function ProcessInstructionList(instructions)
{
    instructions = instructions.split("\n");
    if(!instructions.includes("BEGIN") || !instructions.includes("END"))
        throw new InstructionListInvalid("Instruction list is missing begin and/or end.");
    let isBegan;
    for(instruction in instructions)
    {
        if(isBegan && instructions[instruction] == "BEGIN")
            throw new InstructionListInvalid("Met the second begin operation in the same instructions list.");
        if(!isBegan && instructions[instruction] != "BEGIN")
            continue;
        else if (!isBegan && instructions[instruction] == "BEGIN")
            isBegan = true;
        
        if ( await ProcessInstruction(instructions[instruction]) )
        {
            return;
        }
    }
}

function uuidv4() { // pseudo
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}

function randintval(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min)
}
  
/*

callback => (windowID, buttonID) {};

*/
function CreateWindow(text, posOpts, buttons, customStyle, callback)
{   
    if(posOpts == null)
        posOpts = true;
    
    if(customStyle == null)
        customStyle = { "window": {} };

    let _newWindow = document.createElement('div');
    let _pID = uuidv4();
    _newWindow.className = 'twindow';
    _newWindow.id = _pID;

    if( typeof(posOpts) == "boolean" && posOpts )
        _newWindow.style = "left: 50%; top: 50%; transform: translate(-50%, -50%);";
    else
    {
        if("o" in posOpts && posOpts['o'])
            _newWindow.style = `left: ${posOpts['left']}; top: ${posOpts['top']}; transform: translate(-${posOpts['left']}, -${posOpts['top']});`;
        else
        _newWindow.style = `left: ${posOpts['left']}; top: ${posOpts['top']};`;

    }

    for(s in customStyle['window'])
        _newWindow.style[s] = customStyle['window'][s];

    _newWindow.innerHTML = text;

    if(buttons != null && buttons.length > 0)
    {
        let _btnHolder = document.createElement("div");
        _btnHolder.className = "tbtns";
        _btnHolder.id = "btns_"+_pID;

        for(btn in buttons)
        {
            let _tempButton = document.createElement("span");

            _tempButton.innerText = buttons[btn];
            _tempButton.setAttribute("data-twindow", _pID);
            _tempButton.setAttribute("data-tbutton", btn);
            _tempButton.onclick = (target)=>{ callback(target.currentTarget.getAttribute("data-twindow"), target.currentTarget.getAttribute("data-tbutton"))};

            _btnHolder.append(_tempButton);
        }

        _newWindow.append(_btnHolder);
    }

    document.body.append(_newWindow);

    return _pID;
}

function SwitchUserData(user, secret)
{
    UserData = {
        "user": user,
        "secret": secret
    };

    SetVisualVMData("user", user);
}

function SetVisualVMData(vm_thing, value)
{
    document.getElementById(`vm_${vm_thing}`).innerText = value;
    return _e(vm_thing, value);
}

function CloseWindow(windowID)
{
    document.getElementById(windowID).remove();
}

/* exceptions */

class InstructionListInvalid extends Error
{
    constructor(message)
    {
        super(message);
        this.name = "InstructionListInvalid";
    }
}

class InvalidArgumentToken extends Error
{
    constructor(message)
    {
        super(message);
        this.name = "InvalidArgumentToken";
    }
}

class InvalidBeginToken extends Error
{
    constructor(message)
    {
        super(message);
        this.name = 'InvalidBeginToken';
    }
}