
let courses = JSON.parse(localStorage.getItem("courses") || "[]")
let currentCourse = null

function init(){
renderCourseList()
createScorecard()
}

function saveCourse(){
let name = document.getElementById("courseName").value
let pars = document.getElementById("pars").value.split(",").map(n=>parseInt(n.trim()))
let yards = document.getElementById("yards").value.split(",").map(n=>parseInt(n.trim()))

courses.push({name,pars,yards})
localStorage.setItem("courses",JSON.stringify(courses))
renderCourseList()
}

function renderCourseList(){
let select=document.getElementById("courseSelect")
select.innerHTML=""
courses.forEach((c,i)=>{
let opt=document.createElement("option")
opt.value=i
opt.text=c.name
select.appendChild(opt)
})
}

function loadCourse(){
let idx=document.getElementById("courseSelect").value
currentCourse=courses[idx]
createScorecard()
}

function createScorecard(){
let table=document.getElementById("scoreTable")
table.innerHTML=""

let header="<tr><th>Hole</th><th>Par</th><th>P1</th><th>P2</th><th>Fairway</th><th>Green</th><th>Putts</th><th>Bunker</th><th>Drive Calc</th></tr>"
table.innerHTML+=header

for(let i=1;i<=18;i++){
let par=currentCourse?currentCourse.pars[i-1]:""
let yard=currentCourse?currentCourse.yards[i-1]:""

let scoreSelect=scoreDropdown()

table.innerHTML+=`
<tr>
<td>${i}</td>
<td>${par}</td>
<td>${scoreDropdown()}</td>
<td>${scoreDropdown()}</td>
<td><input type="checkbox"></td>
<td><input type="checkbox"></td>
<td>
<select>
<option>1</option>
<option>2</option>
<option>3</option>
</select>
</td>
<td><input type="checkbox"></td>
<td>
<input placeholder="to pin" oninput="calcDrive(this,${yard})">
<span class="drive"></span>
</td>
</tr>`
}
}

function scoreDropdown(){
let html="<select>"
for(let i=1;i<=8;i++){
html+=`<option>${i}</option>`
}
html+="</select>"
return html
}

function calcDrive(input,yard){
let val=parseInt(input.value)
if(!val||!yard)return
let drive=yard-val
input.nextElementSibling.innerText=drive+" yd"
}

function exportPNG(){
html2canvas(document.querySelector("#scorecard")).then(canvas=>{
let link=document.createElement("a")
link.download="round.png"
link.href=canvas.toDataURL()
link.click()
})
}

window.onload=init
