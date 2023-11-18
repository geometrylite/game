// 2022-02-17 - This is where I'm writing my Octordle game. Hopefully. I don't know how far I'll get. Programming is hard, y'all.
// I've been using https://www.youtube.com/watch?v=mpby4HiElek to help me get started.

// 2022-08-30 - My little program has evolved into 64dle, a beast that includes two html files and three CSS.
// written by Justin Curtis Smith

// 2022-11-07 - I'm renaming this game to 'Cleverdle'. May God have mercy on our souls.

// I'm loading some variables, including both of my wordlists, from other files.

const debugMode = false;

function debug(s) {
    if (debugMode) console.log(s)
}

const tileDisplay = document.querySelector('.previewButtonContainer')
const onePuzzleDisplay = document.querySelector('.onePuzzle-container')


//you used to have to solve 64 puzzles, but now I let the user adjust that number
var seed = Math.floor((new Date() - new Date(2022, 2, 7)) / 86400000); //I believe that this gives us the number of DAYS since the assigned date
var numPuzzles = 16

//Here are some various statistics

let freeTries = 0
if (localStorage.getItem('freeTries') != null) freeTries = localStorage.getItem('freeTries')
let freeWins = 0
if (localStorage.getItem('freeWins') != null) freeWins = localStorage.getItem('freeWins')
let dailyTries = 0
if (localStorage.getItem('dailyTries') != null) dailyTries = localStorage.getItem('dailyTries')
let dailyWins = 0
if (localStorage.getItem('dailyWins') != null) dailyWins = localStorage.getItem('dailyWins')
let currentStreak = 0
if (localStorage.getItem('currentStreak') != null) currentStreak = localStorage.getItem('currentStreak')
let maxStreak = 0
if (localStorage.getItem('maxStreak') != null) maxStreak = localStorage.getItem('maxStreak')

var currentWordle = 0 // this is just the number of the wordle that I'm currently looking at


class summaryTile //each Wordle will have an array of 5 summaryTiles
{
    constructor(in1, in2) {
        this.letter = in1; //this might need to be an array of up to 4 letters
        this.color = in2;
    }
}

//each of the 64 Wordles gets their own object, so I can keep track of some stuff
class Wordle {
    constructor(input) {
        this.target = input;
        this.solved = false
        this.solvedLetters = 0; //0-5

        this.keyboardColors = []
        for (let i = 0; i < 26; i++) {
            this.keyboardColors[i] = "empty"
        }

        //every wordle gets a summary array, which is 5 pairs of (letter, color)
        //every wordle also gets an array called notHere, to keep track of the letters that you know are elsewhere

        this.summary = []
        this.notHere = []
        for (let i = 0; i < 5; i++) {
            this.summary[i] = new summaryTile(" ", "empty")
            this.notHere[i] = ''
        }
    }
}



//I'm populating a little on-screen keyboard

const keyboard = document.querySelector('.key-container')
var keys;

if (localStorage.getItem("keyboard") === null) {
    localStorage.setItem("keyboard", "QWERTY")
}
switch (localStorage.getItem('keyboard')) {
    case "QWERTY":
        debug("qwerty");
        keyboard.classList.add("qwerty")
        keys = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', '«', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'ENTER']

        keys.forEach(key => {
            const buttonElement = document.createElement('button')
            buttonElement.innerHTML = key
            buttonElement.setAttribute('id', key)
            buttonElement.addEventListener('click', () => handleClick(key))
            keyboard.append(buttonElement)


            if (key == 'P' || key == 'L') {
                const br = document.createElement("div");
                //br.innerHTML="<br>"
                keyboard.append(br)
            }
        })


        break;


    case "placeholder":
        debug("placeholder");
        keyboard.classList.add("placeholder")
        //https://www3.nd.edu/~busiforc/handouts/cryptography/letterfrequencies.html
        keys = ['^', 'E/M', 'A/H', 'R/G', 'I/B', 'O/F', 'T/Y', 'N/W', '>', 'S/K', 'L/V', 'C/X', 'U/Z', 'D/J', 'P/Q']

        const left = document.createElement('div')
        left.style.width = '10%';
        left.style.height = '100%';
        left.style.backgroundColor = 'red';
        left.style.position = 'absolute';
        left.style.left = '0px';
        left.innerHTML = '^'
        left.setAttribute('id', '^')
        left.addEventListener('click', () => handleClick('^'))
        keyboard.appendChild(left)



        const right = document.createElement('div')
        right.style.width = '10%';
        right.style.height = '100%';
        right.style.backgroundColor = 'green';
        right.style.position = 'absolute';
        right.style.right = '0px';
        right.innerHTML = 'ENTER'
        right.setAttribute('id', 'ENTER')
        right.addEventListener('click', () => handleClick('ENTER'))
        keyboard.appendChild(right)
        /*		
        		keys.forEach(key => {
        			const buttonElement = document.createElement('button')
        			buttonElement.innerHTML = key
        			buttonElement.setAttribute('id', key)
        			buttonElement.addEventListener('click', () => handleClick(key))
        			keyboard.append(buttonElement)

        			if (key == '>' ) 
        			{
        				const br = document.createElement("div");
        				//br.innerHTML="<br>"
        				keyboard.append(br)
        			}
        		})
        		*/
        break;

    default:
        debug("default");
        break;
}

//when he clicks a button on the onscreen keyboard, this function is called
const handleClick = (key) => {
    debug("clicked " + key)
    if (!isGameOver) {
        if (key === '«') {
            if (currentTile == 0) cycleBackward(1)
            else deleteLetter()
        } else if (key === 'ENTER') {
            if (currentTile == 0) cycleForward(1)
            else if (guessRows[guessRows.length - 1].length == 5) submitGuess()
            else NewAlert("Nope, you need to enter a 5-letter word.")
        } else {
            debug("adding: " + key)
            addLetter(key)
        }
    }
}

//in addition to having an on-screen keyboard, let's try to read the actual keyboard events
var alphabet = 'abcdefghijklmnopqrstuvwxyz';
let upDown = localStorage.getItem("upDown") ? localStorage.getItem("upDown") : 5 //Left and Right move to the prev/next visible puzzle; Up and Down move according to the UpDown setting

document.addEventListener('keydown', keyPress = function(event) {

    for (i = 0; i < alphabet.length; i++) {
        if ((event.key === alphabet[i] || event.key === alphabet[i].toUpperCase())) {
            addLetter(alphabet[i].toUpperCase());
        }
    }

    switch (event.key) {
        case "Enter": // swap to the next non-solved puzzle, submit a guess, or do nothing
            debug("enter pressed, currentTile=" + currentTile)
            if (currentTile == 0) cycleForward(1)
            else if (guessRows[guessRows.length - 1].length == 5) submitGuess()
            else NewAlert("Nope, you need to enter a 5-letter word.")
            break;

        case "Backspace":
            if (currentTile == 0) cycleBackward(1)
            else deleteLetter();
            break;

        case "ArrowLeft":
            cycleBackward(1);
            break;

        case "ArrowRight":
            cycleForward(1);
            break;


            //there are no Up/Down buttons on the virtual keyboard, but maybe there should be



        case "ArrowUp":
            cycleBackward(parseInt(upDown));
            event.preventDefault(); //keep the arrow keys from scrolling the page
            break;

        case "ArrowDown":
            cycleForward(parseInt(upDown));
            event.preventDefault(); //keep the arrow keys from scrolling the page
            break;

    }
});

function cycleForward(d) //if you press Enter on an empty guessRow, cycle to the next unsolved puzzle (d distance away)
{
    debug("cycleForward d= " + d)

    debug("currentWordle " + currentWordle);
    let i = currentWordle + d;

    debug("i=" + i + " numPuzzles=" + numPuzzles);
    if (i >= numPuzzles) i = 0;
    debug("currentWordle " + i);
    while (wordles[i].solved) //if the current puzzle is solved, switch to the next one
    {
        i++
        if (i >= numPuzzles) i = 0
    }
    switchToWordle(i)
}

function cycleBackward(d) //if you press backspace on an empty guessRow, cycle to the previous unsolved puzzle  (d distance away)
{
    debug("cycleBackward d= " + d)
    let i = currentWordle - d;
    if (i < 0) i = numPuzzles - 1;
    debug("currentWordle " + i);
    //debug(wordles[i]);
    while (wordles[i].solved) //if the current puzzle is solved, switch to the previous one
    {
        i--
        if (i < 0) i = numPuzzles - 1
    }
    switchToWordle(i)
}
//END ONSCREEN KEYBOARD STUFF


//let's make a summary area, 5 tiles that summarize what we've learned about the current puzzle
var summaryArea = document.getElementById('summary')
debug("here is my summaryArea: " + summaryArea)
for (let i = 0; i < 5; i++) {
    const tileElement = document.createElement('div')
    tileElement.classList.add('summary-' + i)
    tileElement.classList.add('tile')
    summaryArea.append(tileElement)
}


/*
 *
 * GAME STARTS HERE
 *
 */

let mode = ""
if ("mode" in localStorage) {
    mode = localStorage.getItem("mode")
}

/*
let mode = ""
var idx = document.URL.indexOf('?');
if (idx != -1) 
{
	mode = document.URL.split('?')[1]
}
*/

//I only want the donation and Next buttons to display at the end of the game, not anywhere else where we use NewAlert
document.getElementById('donation-button').style.display = "none"
document.getElementById('next-button').style.display = "none"



var wordles = new Array

//I'm checking to see if there's a "wordles" in session storage; if not, I make a new one, and save it
//I'm doing this for refresh protection

if ("wordles" in localStorage) {
    debug("load wordles[] from storage")
    wordles = JSON.parse(localStorage.getItem("wordles")) //here's an empty array of Wordle objects that I will populate later 
} else {
    debug("make wordles[] from scratch")
    if (mode == "free") numPuzzles = localStorage.getItem('numPuzzlesFree')
    if (mode == "marathon") numPuzzles = localStorage.getItem('numPuzzles');
    if (numPuzzles == null) numPuzzles = 16 // just taking care of the default case, if numPuzzles isn't defined
    for (let i = 0; i < numPuzzles; i++) wordles.push(new Wordle(randomWord(mode).toUpperCase()))

    localStorage.setItem('wordles', JSON.stringify(wordles))

    // I THINK I finally figured out where I want this bit
    if ((mode == "daily") && (localStorage.getItem('latestDaily') == seed) && (debugMode == false)) {
        alert("You tried to start a new daily puzzle, but you may only do that once per day, so starting a free puzzle instead")
        mode = "free"; // he's not allowed to start the same daily multiple times in one day 
    }
}
debug(wordles)


debug("mode=" + mode) //mode can either be 'daily' or 'free'
if (mode == "daily") //mode is only still daily if this is the first Daily attempt today
{
    numPuzzles = 16;
    localStorage.setItem('numPuzzles', 16)
}

//let's change the title of the page, because why not
mode == 'daily' ? document.title = "Cleverdle #" + seed + " by AdmiralSpunky" : document.title = "Cleverdle by AdmiralSpunky"

switch (mode) {
    case 'daily':
        document.querySelector('.leftTitle').innerHTML = "daily Cleverdle #" + seed
        break

    case 'free':
        document.querySelector('.leftTitle').innerHTML = "free Cleverdle"
        break

    case 'marathon':
        document.querySelector('.leftTitle').innerHTML = "marathon Cleverdle"
        break
}

//now that I've loaded the wordles, I'm drawing a button display: an area for my 64 separate wordle puzzle representations
for (let i = 0; i < numPuzzles; i++) {
    //now let's make the button to zoom in on that puzzle:
    let btn = document.createElement("button");
    btn.classList.add("previewButton-" + i)

    //each button shows the puzzle number, and then five preview squares
    btn.innerHTML = i > 9 ? "" + i : "0" + i; //I'm just adding a leading zero to single-digit numbers so everything lines up
    for (let j = 0; j < 5; j++) {
        let sqr = document.createElement('div')
        sqr.classList.add("previewButton-" + i + "-previewSquare-" + j)
        sqr.innerHTML = " " //not sure if this is necessary
        btn.appendChild(sqr);
    }

    //my onclick event was getting triggered when it wasn't supposed to be, which was horribly annoying, but this solution seems to work:	
    btn.addEventListener("click", function() {
        debug(i + " Button is clicked")
        switchToWordle(i)
    }, {
        once: true
    });

    tileDisplay.appendChild(btn);
}

let currentTile = 0 //0-5 

//these are all the guesses that the player has made, an array of 5-letter words
var guessRows = new Array()

//if we're resuming an old game, start with the same number of guessesRemaining
//otherwise, take the value from the initial guesses slider
var guessesRemaining = 6
if ('guessesRemaining' in localStorage) guessesRemaining = localStorage.getItem('guessesRemaining')
else if ('initialGuesses' in localStorage && mode == 'free') guessesRemaining = localStorage.getItem('initialGuesses')

var heartsArea = document.querySelector('.heartsDiv')
heartsArea.innerHTML = "remaining guesses: " + guessesRemaining + "<br> mode: " + mode
if (mode == "daily") {
    heartsArea.innerHTML += " " + seed
    const weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const d = new Date();
    let day = weekday[d.getDay()];
    heartsArea.innerHTML += " " + day;
}
debug("guessesRemaining = " + guessesRemaining)

//Every puzzle has at least one guess row and possibly some old ones, if we're resuming from an old puzzle
//I'm doing this for refresh protection

if ("guessRows" in localStorage) {
    debug("load guessRows[] from storage")
    guessRows = JSON.parse(localStorage.getItem("guessRows"))
    debug(guessRows + guessRows.length)

    // When I refresh a game, I need to do 4 things: check every guessRow against every Wordle, to set the colors on the preview buttons
    // and, only for the current wordle, I need to update the colors on the keyboard, the summary row (which I also need to blank out first), and the colors on the old guessRows

    //we have to check each of the old guessRows against each of the wordles
    //we have to draw each of the old guessRows (we'll shrink the old ones)
    for (let i = 0; i < guessRows.length; i++) {
        //draw the row and shrink it
        let rowElement = document.createElement('div')
        rowElement.setAttribute('id', 'guessRow-' + i)

        for (let j = 0; j < 5; j++) {
            tileElement = document.createElement('div')
            tileElement.setAttribute('id', 'tile-' + j)
            tileElement.classList.add('tile')

            let letter = guessRows[i][j]
            tileElement.textContent = letter
            tileElement.setAttribute('data', letter)

            rowElement.append(tileElement)

            //I don't remember why I was doing this next section here; it doesn't seem to make a difference?
            /*
            let guess = guessRows[i].join('')
            let targetWord = wordles[currentWordle].target
			
            if (guess[j] == targetWord[j]) // update the summary row for the current wordle
            {
            	let summaryTile = document.querySelector('.summary-' + j)
            	debug("summaryTile[" + j + "]" + summaryTile)
            	summaryTile.innerHTML = guess[j]
            	summaryTile.classList.add("hit")
            }
            */
        }
        rowElement.classList.add('old')
        onePuzzleDisplay.append(rowElement)

        //now check the row against every other wordle
        for (let k = 0; k < wordles.length; k++) {
            if (wordles[k].solved)
                document.querySelector('.previewButton-' + k).classList.add("hit")

            checkRow(i, k) //I'm not sure what checkrow even does anymore
            //TODO: is there a reason why Checkrow doesn't adjust these colors?
            // we need to adjust the preview colors on each of the preview squares in each of the 64 buttons
            guessRows[i].forEach((_guess, guessIndex) => {

                if (_guess == wordles[k].target[guessIndex]) {
                    document.querySelector('.previewButton-' + k + '-previewSquare-' + guessIndex).classList.add("hit")
                    document.querySelector('.previewButton-' + k + '-previewSquare-' + guessIndex).innerHTML = _guess

                    wordles[k].summary[guessIndex].letter = _guess
                    wordles[k].summary[guessIndex].color = "hit"
                }
            })
        }
    }

    currentWordle = localStorage.getItem("currentWordle") ? localStorage.getItem("currentWordle") : 0
    currentTile = localStorage.getItem("currentTile") ? localStorage.getItem("currentTile") : 0

    document.getElementById('guessRow-' + (guessRows.length - 1)).classList.remove('old') //I add 'old' to each row as I draw it, and then I remove it from the last row, which is sloppy

    switchToWordle(currentWordle)
} else {
    debug("make guessRows[] from scratch")
    let rowElement = document.createElement('div')
    rowElement.setAttribute('id', 'guessRow-' + 0)

    for (let j = 0; j < 5; j++) {
        const tileElement = document.createElement('div')
        tileElement.setAttribute('id', 'tile-' + j)
        tileElement.classList.add('tile')
        rowElement.append(tileElement)
    }
    onePuzzleDisplay.append(rowElement)

    guessRows.push(['', '', '', '', '']) //if we have to make a new guessRows, the first row should be blank

    //we start by looking at puzzle 0
    document.querySelector('.previewButton-' + 0).classList.add('current')
}

//adding a different color to the tile where the player's input will currently go
let tile = document.getElementById('guessRow-' + (guessRows.length - 1)).children[currentTile]
tile.classList.add('current') //cornflower blue

debug(guessRows)

var isGameOver = false

//var postmortem = document.title + ": sevendral.com/Cleverdle/ <br>" //assembling a report for the end of the game
var solved = 0



function addLetter(letter) {
    //I add a letter to the current tile, then increment the current tile, and make that the new current tile

    guessRows[guessRows.length - 1][currentTile] = letter
    let oldTile = document.getElementById('guessRow-' + (guessRows.length - 1)).children[currentTile]
    oldTile.textContent = letter
    oldTile.setAttribute('data', letter)
    oldTile.classList.remove('current')

    currentTile++

    if (currentTile > 4) currentTile = 4;

    let tile = document.getElementById('guessRow-' + (guessRows.length - 1)).children[currentTile]
    tile.classList.add('current') //cornflower blue

    debug("guessRows[guessRows.length-1]=" + guessRows[guessRows.length - 1])
}


function deleteLetter() {
    //deleteLetter works in one of two ways.

    if (currentTile == 4 && guessRows[guessRows.length - 1][currentTile] != '') // If currentTile is the last in the row, and contains a letter, then we want to delete that letter
    {
        guessRows[guessRows.length - 1][currentTile] = ''
        let oldTile = document.getElementById('guessRow-' + (guessRows.length - 1)).children[currentTile]
        oldTile.textContent = ''
        oldTile.setAttribute('data', '')
    } else if (currentTile > 0) //otherwise, delete the previous letter, and move the 'current' tag
    {
        //I remove the 'current' tag, decrement a pointer, remove the letter from the previous tile, then make that the new current tile

        let oldTile = document.getElementById('guessRow-' + (guessRows.length - 1)).children[currentTile]
        oldTile.classList.remove('current')

        currentTile--
        if (currentTile < 0) currentTile = 0;

        guessRows[guessRows.length - 1][currentTile] = ''
        let tile = document.getElementById('guessRow-' + (guessRows.length - 1)).children[currentTile]
        tile.textContent = ''
        tile.setAttribute('data', '')

        tile.classList.add('current') //cornflower blue 
    }

}


//submitGuess is called whenever we click Enter, but also when we load guessRows from Storage - maybe it shouldn't work that way?
//submitGuess needs to adjust the colors on the current guessRow, adjust the colors of the summary row, adjust the colors on the 64 previewButtons, possibly add a new guessRow, and do gameOver checks. Oh, and flip the current guessRow
function submitGuess() {
    debug("submitGuess called with " + guessRows[guessRows.length - 1] + " - " + guessRows[guessRows.length - 1].join(''))

    if (!validGuesses.includes(guessRows[guessRows.length - 1].join('').toLowerCase())) {
        NewAlert("What are you trying to pull? Enter a valid word.")

        for (let i = 0; i < 5; i++) deleteLetter()
        //maybe we should penalize the player for guessing an invalid word?
        //currentRow++;
        //currentTile = 0
        //document.getElementById('tile-' + currentTile).classList.add('current') //cornflower blue
        //document.querySelector('.summary-' + currentTile).classList.add('current') //cornflower blue
        return;
    }

    document.querySelector('.leftTitle').innerHTML = guessRows[guessRows.length - 1].join('') + " submitted"
    if (mode == 'daily')
        localStorage.setItem('latestDaily', seed) //we wait until the user has submitted a guess before we give them credit for trying to solve the daily puzzle

    guessesRemaining-- // every time we submit a valid guess, we use one of our remaining guesses
    let oldSolved = solved // this is a pretty sloppy way to figure out if we've solved any new puzzles during this function call

    for (let i = 0; i < numPuzzles; i++) //have we found any new letters? have we solved any of the wordles?
    {
        // we need to adjust the preview colors on each of the preview squares in each of the 16 buttons
        guessRows[guessRows.length - 1].forEach((_guess, guessIndex) => {

            //debug("checking each letter in the last guess ");
            //debug("checking each letter in the last guess " + wordles[i].target + _guess + ( wordles[i].target.includes(_guess) ) + ( wordles[i].summary[guessIndex].color != "hit") + ( ( wordles[i].target.includes(_guess) ) && ( wordles[i].summary[guessIndex].color != "hit")) );

            if (_guess == wordles[i].target[guessIndex] && wordles[i].summary[guessIndex].letter != _guess) //if the letter matches, and hasn't already matched 
            {
                document.querySelector('.previewButton-' + i + '-previewSquare-' + guessIndex).classList.remove("near")
                document.querySelector('.previewButton-' + i + '-previewSquare-' + guessIndex).style.color = 'white'
                document.querySelector('.previewButton-' + i + '-previewSquare-' + guessIndex).innerHTML = _guess

                wordles[i].summary[guessIndex].letter = _guess
                wordles[i].summary[guessIndex].color = "hit"

                wordles[i].solvedLetters++

                    //flip the newly discovered letters on the previewButton
                    setTimeout(() => {
                        document.querySelector('.previewButton-' + i + '-previewSquare-' + guessIndex).classList.add("flip")
                    }, 500)
            }

            //here I gather the Near feedback into a notHere array, so I can display those letters in the summary row for each puzzle
            else if (wordles[i].target.includes(_guess) && wordles[i].summary[guessIndex].color != "hit" && !wordles[i].notHere[guessIndex].includes(_guess)) {
                wordles[i].notHere[guessIndex] += _guess //I'm attempting to keep track of which letters are in the puzzle, but not in a specific slot
                //debug("wordles[i].notHere[guessIndex] += _guess")
                document.querySelector('.previewButton-' + i + '-previewSquare-' + guessIndex).classList.add("near")
                //document.querySelector('.previewButton-' + i + '-previewSquare-' + guessIndex).innerHTML = _guess

                wordles[i].summary[guessIndex].color = "near"
            }
        })

        if (wordles[i].solvedLetters == 5 && wordles[i].solved == false) // we want this to trigger only the first time you solve a wordle
        {
            solved++
            wordles[i].solved = true;
            debug("wordles[" + i + "] solved for the first time, solved=" + solved)

            let beat = new Audio('http://sevendral.com/cleverdle/res/success-1-6297.mp3');
            "volume" in localStorage ? beat.volume = localStorage.getItem('volume') : beat.volume = 0.5
            beat.play();

            //we might need multiple notifications at once: notifications.push()
            document.querySelector('.leftTitle').innerHTML = "puzzle " + i + " solved, guess++"

            //postmortem += "\n" + (maxRows-currentRow) + " | " + solved

            document.querySelector('.previewButton-' + i).classList.add("hit")

            //when you first solve a Wordle, do a little flip animation on the button
            setTimeout(() => {
                document.querySelector('.previewButton-' + i).classList.add("flip")
            }, 500)

            //let's add a fading popup here, to have some visual feedback on a correct guess
            let popupContainer = document.querySelector('.bonus');
            popupContainer.style.display = "block";
            setTimeout(function() {
                popupContainer.style.display = "none";
            }, 3000);
        }

        checkRow(guessRows.length - 1, i); //adjust the colors of the submitted guessRow against the current Wordle 		

    } //for (let i = 0 ; i< numPuzzles ; i++) //have we found any new letters? have we solved any of the wordles?

    if (solved > oldSolved) guessesRemaining++
        else {
            let beat = new Audio('http://sevendral.com/cleverdle/res/failure-drum-sound-effect-2-7184.mp3');
            "volume" in localStorage ? beat.volume = localStorage.getItem('volume') : beat.volume = 0.5
            beat.play();
        }


    //heartsArea.innerHTML = "remaining guesses: " + (guessRows.length-currentRow-1)
    heartsArea.innerHTML = "remaining guesses: " + guessesRemaining + "<br> mode: " + mode
    if (mode == "daily") heartsArea.innerHTML += " " + seed


    /*	TODO: I think we'll want two separate animations here, a half flip for each, with a call to checkRow() in the middle

    	const rowTiles = document.querySelector('#guessRow-' + currentRow).childNodes
    	rowTiles.forEach((tile, index) => {
    	setTimeout(() => {
    		tile.classList.add("flip")
    		 
    	}, 500 * index)
    	})
    	flipRow()
    */

    /*	fade the previous 5 rows - I don't know if I like this. It looks cool, but valuable information eventually disappears

    	for ( let i = 1 ; i<5 ; i++)
    	{
    		if (currentRow-i>=0) document.querySelector('#guessRow-' + (currentRow-i) ).style.opacity = 1.0 - .2*i
    	}

    //hide any rows more than 5 in the past
    	if (currentRow>=6)document.querySelector('#guessRow-' + (currentRow-6)).classList.add('hide')
    */
    debug("solved " + solved + " out of " + numPuzzles)

    if (solved == numPuzzles) //you solved all of the puzzles
    {
        debug("game over with " + numPuzzles + " numPuzzles")
        gameOver()
    } else if (guessesRemaining == 0) //you used your last guess
    {
        //postmortem += "<br>try harder next time; you solved " + solved + " out of " + numPuzzles

        alert("you were looking for " + wordles[currentWordle].target + "\nYou solved " + solved + " puzzles.")
        if (mode == 'daily') currentStreak = 0
        if (mode == 'marathon') numPuzzles = 1
        gameOver()
    } else //the game is still going
    {
        debug("solved=" + solved + "/" + numPuzzles)

        //the current row is now an old row (so we can shrink it with CSS)
        document.getElementById('guessRow-' + (guessRows.length - 1)).classList.add('old')

        //remove 'current' from the old tile
        let oldTile = document.getElementById('guessRow-' + (guessRows.length - 1)).children[currentTile]
        oldTile.classList.remove('current')

        //we add a blank row to guessRows here
        guessRows.push(['', '', '', '', ''])

        //draw a new row
        let rowElement = document.createElement('div')
        rowElement.setAttribute('id', 'guessRow-' + (guessRows.length - 1))

        for (let j = 0; j < 5; j++) {
            const tileElement = document.createElement('div')
            tileElement.setAttribute('id', 'tile-' + j)
            tileElement.classList.add('tile')
            rowElement.append(tileElement)
        }
        onePuzzleDisplay.append(rowElement)

        //add 'current' to the first tile of the new row
        currentTile = 0
        let tile = document.getElementById('guessRow-' + (guessRows.length - 1)).children[currentTile]
        tile.classList.add('current') //cornflower blue


        while (wordles[currentWordle].solved) //TODO: What if there are no unsolved puzzles, and this is an infinite loop?
        {
            debug("wordle " + currentWordle + " is solved, checking the next one")
            currentWordle++
            if (currentWordle >= numPuzzles) currentWordle = 0
        }
        //yes, we do have to call switchToWordle here, even if we don't actually switch, because we haven't updated the summary row yet
        switchToWordle(currentWordle) // switch to the next unsolved puzzle



        //we have to save this stuff every time it changes, in case the page is refreshed
        localStorage.setItem("wordles", JSON.stringify(wordles))
        localStorage.setItem("guessRows", JSON.stringify(guessRows))
        localStorage.setItem("currentTile", currentTile)
        localStorage.setItem("guessesRemaining", guessesRemaining)
        localStorage.setItem("currentWordle", currentWordle)
        debug("guessesRemaining= " + guessesRemaining)
    }

} //function submitGuess ()


//TODO: I'm not entirely sure how checkRow functions anymore
//check the current guessRow against the Wordle.target of the current index, to set the colors on the guessRow
//this function is called once in submitGuess (because the guessRow changed), and also down in switchToWordle (because the current Wordle changed), and when we try to resume an ongoing puzzle
function checkRow(guessRowIndex, wordleIndex) {
    let guessRow = document.querySelector('#guessRow-' + guessRowIndex)
    const rowTiles = document.querySelector('#guessRow-' + guessRowIndex).childNodes

    const guess = guessRows[guessRowIndex].join('')
    let targetWord = wordles[wordleIndex].target

    debug("checkRow(" + guessRowIndex + "): " + guess)
    debug("wordles[" + wordleIndex + "].target: " + targetWord + "\n\n")

    //we need to translate the incoming letter into a number so we can look it up in an array
    let keyNumber = -1

    //guessRow.classList.remove("show") //we want to hide every row except for the rows that contain Near letters for this wordle

    //we have to loop through the guess letters multiple times, because we want to remove the Hits before we check the Nears
    for (i = 0; i < guess.length; i++) {
        //debug("\n\ncheck for a Hit")
        //debug("guess[" + i + "] " + guess[i])
        //debug("targetWord[" + i + "] " + targetWord[i])

        //remove the previously-existing color tags (because a Near might upgrade to a Hit)
        rowTiles[i].classList.remove("hit")
        rowTiles[i].classList.remove("near")
        rowTiles[i].classList.remove("miss")

        //we need to translate the incoming letter into a number so we can look it up in an array
        for (j = 0; j < alphabet.length; j++)
            if ((guess[i] === alphabet[j] || guess[i] === alphabet[j].toUpperCase())) {
                keyNumber = j
            }

        //debug(guess[i] + "=" + keyNumber)
        //debug(wordles[wordleIndex].keyboardColors[keyNumber])

        if (guess[i] == targetWord[i]) {
            //debug( "if (guess[i] == targetWord[i])" )
            rowTiles[i].classList.add("hit")
            wordles[wordleIndex].keyboardColors[keyNumber] = "hit"

            targetWord = targetWord.replace(guess[i], ' ') //remove the letter from the target, so repeated letters don't also turn yellow, which would be misleading			
        }
    }

    for (i = 0; i < guess.length; i++) //we have to loop through the guess letters multiple times, because we want to remove the Hits before we check the Nears
    {
        //debug("\n\ncheck for a Near")
        //debug("guess[" + i + "] " + guess[i])
        //debug("targetWord " + targetWord)

        //we need to translate the incoming letter into a number so we can look it up in an array
        for (j = 0; j < alphabet.length; j++) {
            if ((guess[i] === alphabet[j] || guess[i] === alphabet[j].toUpperCase())) {
                keyNumber = j
            }
        }

        if (targetWord.includes(guess[i])) {
            //debug( "NEAR" )

            document.querySelector('.previewButton-' + wordleIndex + '-previewSquare-' + i).style.background = 'near'
            //guessRow.classList.add("show") // this probably won't work; I only want to add "show" to this row once
            if (!rowTiles[i].classList.contains("hit")) {
                rowTiles[i].classList.add("near")
            }
            if (wordles[wordleIndex].keyboardColors[keyNumber] != "hit") {
                wordles[wordleIndex].keyboardColors[keyNumber] = "near"
            }
            targetWord = targetWord.replace(guess[i], ' ') //remove the letter from the target, so repeated letters don't also turn yellow, which would be misleading
        } else {
            //debug( "miss" )
            rowTiles[i].classList.add("miss")
            if (wordles[wordleIndex].keyboardColors[keyNumber] != "hit" && wordles[wordleIndex].keyboardColors[keyNumber] != "near") wordles[wordleIndex].keyboardColors[keyNumber] = 'miss'
        }
        //debug(wordles[wordleIndex].keyboardColors[keyNumber])
        const key = document.getElementById(guess[i]) //each key on the onscreen keyboard has as an id the letter on the key
        if (key != null) {
            key.classList.remove("miss", "near")
            key.classList.add(wordles[wordleIndex].keyboardColors[keyNumber])
        }
    }

    //now let's update the summary row for the current wordle

    for (let m = 0; m < 5; m++) {
        let summaryBox = document.querySelector('.summary-' + m)
        //debug(summaryBox)

        summaryBox.classList.remove("hit", "near", "miss")
        summaryBox.classList.add(wordles[wordleIndex].summary[m].color)

        summaryBox.innerHTML = ""

        //debug("wordles[wordleIndex].summary["+m+"].color=" + wordles[wordleIndex].summary[m].color )
        if (wordles[wordleIndex].summary[m].color == "hit") {
            //debug("m="+m)
            summaryBox.innerHTML = wordles[wordleIndex].summary[m].letter
            summaryBox.style = "color: white"
            document.querySelector('.previewButton-' + wordleIndex + '-previewSquare-' + m).classList.add("hit")
        } else if (wordles[wordleIndex].summary[m].color == "near") {
            summaryBox.innerHTML = wordles[wordleIndex].notHere[m]
            summaryBox.style = "color: black"
            document.querySelector('.previewButton-' + wordleIndex + '-previewSquare-' + m).classList.add("near")
        }
    }

} //function checkRow(guessRowIndex,wordleIndex)


function gameOver() {
    isGameOver = true; //just turning off the onscreen keyboard; this step probably isn't necessary	
    localStorage.setItem('numPuzzles', numPuzzles)

    //at the end of the game, go ahead and show the solutions to every puzzle
    for (let i = 0; i < numPuzzles; i++) {
        for (let j = 0; j < 5; j++)
            document.querySelector('.previewButton-' + i + '-previewSquare-' + j).innerHTML = wordles[i].target[j]
    }

    postmortem = "Cleverdle by AdmiralSpunky: sevendral.com/cleverdle/" //assembling a report for the end of the game

    if (mode == 'daily') {
        postmortem += "<br>Daily #" + seed;

        const weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const d = new Date();
        let day = weekday[d.getDay()];
        postmortem += " " + day;
    }



    if (guessesRemaining > 0) {
        postmortem += "<br>" + "Victory is yours! solved " + numPuzzles + " puzzles with " + guessesRemaining + " guesses remaining!";

        if (mode == 'daily') {
            dailyWins++
            currentStreak++;

            maxStreak = Math.max(currentStreak, maxStreak)
        }
        if (mode == 'marathon') {
            if (numPuzzles > localStorage.getItem('marathonHigh')) {
                localStorage.setItem('marathonHigh', numPuzzles)
            }
            numPuzzles = numPuzzles * 2
            if (numPuzzles >= 100) {
                postmortem += "<br><br>Marathon mode completed! I'm so proud of you! Now do something else."
                numPuzzles = 1
            }

        }
    } else {
        postmortem += "<br>try harder next time; you solved " + solved + " out of " + numPuzzles
        numPuzzles = 1 //I think that we do this for Marathon mode
    }

    if (mode == 'marathon') {
        postmortem += "<br>marathon mode"
        if (localStorage.getItem('marathonHigh') != null) {
            postmortem += ", high score: " + localStorage.getItem('marathonHigh')
        }
    }

    //postmortem += "<br><br>free: " + freeWins + "/" + freeTries + " daily: " + dailyWins + "/" + dailyTries
    var guessesRemainingHistory = [0, 0, 0, 0, 0, 0, 0];

    if (mode == 'daily') {
        dailyTries++
        postmortem += "<br><br>" + dailyWins + " W - " + (dailyTries - dailyWins) + " L, " + dailyTries + " tries, " + Math.round(dailyWins / dailyTries * 100) + "%" +
            "<br>current streak: " + currentStreak + " maxStreak: " + maxStreak;

        postmortem += "<br><br>puzzles solved with # guesses remaining:";

        if ("guessesRemainingHistory" in localStorage) {
            guessesRemainingHistory = JSON.parse(localStorage.getItem('guessesRemainingHistory'));
        }
        guessesRemainingHistory[guessesRemaining]++
            debug("guessesRemainingHistory:" + guessesRemainingHistory)
        for (i = 6; i >= 0; i--) {
            postmortem += "<br>" + i + " | " + guessesRemainingHistory[i]
        }
        postmortem += " failed attempts"
    }


    localStorage.setItem('numPuzzles', numPuzzles) //this can change, if the user is in marathon mode

    //I only want the donation button to display here at the end of the game, not anywhere else where we use NewAlert
    document.getElementById('donation-button').style.display = "block"
    //I only want the Next button to display here at the end of the game, not anywhere else where we use NewAlert
    document.getElementById('next-button').style.display = "block"

    NewAlert(postmortem)


    //removing session variables
    localStorage.removeItem('wordles')
    localStorage.removeItem("guessRows")
    localStorage.removeItem('guessesRemaining')

    //adjusting stats
    localStorage.setItem('dailyTries', dailyTries)
    //localStorage.setItem('freeTries', freeTries)
    localStorage.setItem('dailyWins', dailyWins)
    //localStorage.setItem('freeWins', freeWins)
    localStorage.setItem('currentStreak', currentStreak)
    localStorage.setItem('maxStreak', maxStreak)
    //localStorage.setItem("latestDaily",seed)
    localStorage.setItem("guessesRemainingHistory", JSON.stringify(guessesRemainingHistory))


    //formatting the postmortem for Discord, and automatically copying it
    postmortem = postmortem.replaceAll('<br>', '\n')
    postmortem = "```" + postmortem + "```"
    //https://stackoverflow.com/questions/400212/how-do-i-copy-to-the-clipboard-in-javascript
    var textarea = document.createElement("textarea");
    textarea.textContent = postmortem;
    textarea.style.position = "fixed"; // Prevent scrolling to bottom of page in Microsoft Edge.
    document.body.appendChild(textarea);
    textarea.select();
    try {
        return document.execCommand("copy"); // Security exception may be thrown by some browsers.
    } catch (ex) {
        console.warn("Copy to clipboard failed.", ex);
        return prompt("Copy to clipboard: Ctrl+C, Enter", postmortem);
    } finally {
        document.body.removeChild(textarea);
    }

} // function gameOver()

function randomWord(mode) {
    var i
    if (mode == 'daily') {
        let seed = Math.floor((new Date() - new Date(2022, 2, 7)) / 86400000) //I believe that this gives us the number of DAYS since the assigned date
        i = Math.floor(((Math.sin(seed) + 1) / 2) * targetWords.length); //this is how you get a random index, right?
    } else {
        i = Math.floor(Math.random() * targetWords.length)
    }
    let word = targetWords[i]
    targetWords.splice(i, 1) //cut that entry out of the array
    //debug(word)
    return word

}


//I'm not really using flipTile() anymore - it just animates a row the first time you guess it
function flipRow() {
    //const rowTiles = document.querySelector('#guessRow-' + currentRow).childNodes
    let targetWord = wordles[currentWordle].target
    debug("targetWord " + targetWord)

    const guess = []

    rowTiles.forEach(tile => {
        guess.push({
            letter: tile.getAttribute('data'),
            color: 'grey-overlay'
        })
    })

    debug(guess)

    guess.forEach((guess, index) => {
        debug("guess.letter " + guess.letter)
        debug("targetWord[index] " + targetWord[index])

        if (guess.letter == targetWord[index]) {
            guess.color = "hit"
            targetWord = targetWord.replace(guess.letter, ' ')
        }
    })

    guess.forEach(guess => {
        if (targetWord.includes(guess.letter)) {
            guess.color = "near"
            targetWord = targetWord.replace(guess.letter, ' ')
        }
    })

    guess.forEach(guess => {

        guess.color = "miss"
        targetWord = targetWord.replace(guess.letter, ' ')

    })

    rowTiles.forEach((tile, index) => {
        setTimeout(() => {
            tile.classList.add("flip")
            tile.classList.add(guess[index].color)
            addColorToKey(guess[index].letter, guess[index].color)
        }, 500 * index)
    })
}

//we're not using this function anymore, although we probably should be
const addColorToKey = (keyLetter, color) => {
    const key = document.getElementById(keyLetter)
    if (color != null) key.classList.add(color)
}

function switchToWordle(i) //I call this function from btn.onclick, but I also call it from submitGuess (if we submit a guess that solves the current wordle, we switch to the next unsolved one), and when we resume
{
    debug("switchToWordle(" + i + ")")
    document.querySelector('.leftTitle').innerHTML = "switched to"
    document.querySelector('.rightTitle').innerHTML = "Wordle " + i

    //clear the previous button's bgColor
    document.querySelector('.previewButton-' + currentWordle).classList.remove('current')

    currentWordle = i //setting a global currentWordle for later

    //set the current button's bg to blue
    document.querySelector('.previewButton-' + currentWordle).classList.add('current')

    //reset the colors on the onscreen keyboard (remember, wordle.keyboardColors is indexed by alphabet, not by keyboard order
    Array.from(alphabet).forEach((k, index) => {
        const key = document.getElementById(k.toUpperCase())
        key.classList.remove("hit", "near", "miss") //remove any other styles that might have accumulated on the key
        key.classList.add(wordles[i].keyboardColors[index])
    })

    /*
    //now we update the tiles in each of the guessRows for the new current Wordle: 
    guessRows.forEach((guessRow,guessIndex) => {
    	//we want to evaluate the colors on every row except the current one (we really only want to evaluate the rows in the past, but baby steps:)
    	checkRow(guessIndex,i)
    })
    */

    //check every row except the last (current) row (because the current row hasn't been submitted yet)
    for (let row = 0; row < guessRows.length - 1; row++) {
        checkRow(row, i)
    }

    localStorage.setItem("currentWordle", i)
}


function toggleInfo() {
    var x = document.getElementById("info")
    if (x.style.display === "none") {
        x.style.display = "block";
    } else {
        x.style.display = "none";
    }
}