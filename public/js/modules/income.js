function showIncomeEditor(){

    incomeDisplay.style.display = "none";
    incomeEdit.style.display = "block";

    incomeInput.value =incomeText.textContent.replace("₹","");

    incomeInput.focus();
}


function cancelIncomeEdit(){

    incomeEdit.style.display = "none";
    incomeDisplay.style.display = "block";
}

async function loadIncome(){

    try{

        const token = localStorage.getItem("token");

        const response = await axios.get(

            `${BASE_URL}/users/income`,

            {
                headers:{
                    Authorization:token
                }
            }
        );

        incomeText.textContent =
            `₹${response.data.monthlyIncome || 0}`;

    }

    catch(err){

        console.log(err);

    }

}

async function saveIncomeData(){

    try{

        const token = localStorage.getItem("token");

        const monthlyIncome =
            Number(incomeInput.value);

        const response = await axios.put(

            `${BASE_URL}/users/income`,

            {
                monthlyIncome
            },

            {
                headers:{
                    Authorization:token
                }
            }

        );

        incomeText.textContent =
            `₹${response.data.monthlyIncome}`;

        cancelIncomeEdit();

    }

    catch(err){

        console.log(err);

    }

}