
//show Premium Features

function showPremiumFeatures(){
    const token=localStorage.getItem("token");

    if(!token) return;

    const decodedToken=jwt_decode(token);

     if(decodedToken.isPremiumUser){

        

        premiumNav.style.display = "flex";

    }else{

       

        premiumNav.style.display = "block";

       

    }
}





//buy premium btn
async function buyPremium() {

    try {

        const token = localStorage.getItem("token");

        // Create order from backend
        const response = await axios.get(
            `${BASE_URL}/purchase/premiummembership`,
            {
                headers: {
                    Authorization: token
                }
            }
        );

        console.log(response.data);

        const cashfree = Cashfree({
            mode: "sandbox"
        });

        const checkoutOptions = {
            paymentSessionId: response.data.payment_session_id,
            redirectTarget: "_modal"
        };

        cashfree.checkout(checkoutOptions).then(async (result) => {

            console.log(result);

            // User closed payment popup
            if (result.error) {

                await axios.post(
                    `${BASE_URL}/purchase/failedtransaction`,
                    {
                        order_id: response.data.order_id
                    },
                    {
                        headers: {
                            Authorization: token
                        }
                    }
                );

                alert("TRANSACTION FAILED");
                return;
            }

            // Payment Successful
            if (result.paymentDetails) {

                const paymentResponse = await axios.post(
                    `${BASE_URL}/purchase/updatetransactionstatus`,
                    {
                        order_id: response.data.order_id
                    },
                    {
                        headers: {
                            Authorization: token
                        }
                    }
                );

                // Save new premium token
                localStorage.setItem("token", paymentResponse.data.token);

                alert("Transaction Successful");

                // Reload page to show premium features
                location.reload();
            }

        });

    } catch (err) {

        console.log(err);
        alert("Something went wrong");

    }

}