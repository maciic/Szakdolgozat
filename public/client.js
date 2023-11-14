document.addEventListener('DOMContentLoaded', function () {
    	
    //new DataTable('#formatted-table');
    const dataForm = document.getElementById('dataForm');
    const dataTable = document.getElementById('dataTable');
    const addDiscountButton = document.getElementById('addDiscountButton');
    const removeDiscountButton = document.getElementById('removeDiscountButton');
    const discountList = document.getElementById('discountList');
    const discountSelect = document.getElementById('discountSelect');
    const slider = document.getElementById("weight");
    const costeWeight = document.getElementById("costWeight");
    const distanceWeight = document.getElementById("distanceWeight");
    const bestTicketName = document.getElementById("bestTicketName")
    const bestTicketCost = document.getElementById("bestTicketCost")

    costeWeight.innerHTML = 100 - slider.value;
    distanceWeight.innerHTML = slider.value;

    // Handle Keresés button
    dataForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const start = dataForm.elements.start.value;
        const end = dataForm.elements.end.value;
        const weight = slider.value;
        const discountsItems = discountList.getElementsByTagName('li');
        let discountsFromList = []

        for (const discountsItem of discountsItems) {
            discountsFromList.push(discountsItem.textContent);
        }
        sendDataToServer('/submit', { start, end, weight, discountsFromList });

        // Clear the input fields
        dataForm.elements.start.value = '';
        dataForm.elements.end.value = '';
        dataForm.elements.weight.value = '';
        discountList.innerHTML = '';
        slider.value = 0
        costeWeight.innerHTML = 100 - slider.value;
        distanceWeight.innerHTML = slider.value;
    });

    // Handle delete button click
    dataTable.addEventListener('click', function (e) {
        if (e.target && e.target.classList.contains('delete-button')) {
            const index = e.target.getAttribute('data-index');
            deleteItemFromList(index);
        }
    });

    // Handle Add Item button click
    addDiscountButton.addEventListener('click', function () {

        let myDiscounts = discountList.getElementsByTagName("li")
        for (x of myDiscounts) {
            if (x.textContent == discountSelect.value) {
                alert("A kedvezémny már hozzáadva!")
                return
            }
        }

        const listItem = document.createElement('li');
        listItem.textContent = discountSelect.value;
        discountList.appendChild(listItem);
    });

    // Handle Remove Last Item button click
    removeDiscountButton.addEventListener('click', function () {
        const listItems = discountList.getElementsByTagName('li');
        if (listItems.length > 0) {
            discountList.removeChild(listItems[listItems.length - 1]);
        }
    });

    // Handle Slider 
    slider.oninput = function () {
        costeWeight.innerHTML = 100 - this.value;
        distanceWeight.innerHTML = this.value;
    }

    // Handle best ticket
    function setupBestTicket(myResponds) {
        let bestPriceListAll = new Map()
        let bestPrice = ["", null]
        for (const myRespond of myResponds) {
            let myTicekt = myRespond.travelTicket.split("-")
            if(myRespond.priceMultiplier){
                if(bestPriceListAll.get(myTicekt[0])){
                    bestPriceListAll.set(myTicekt[0], (bestPriceListAll.get(myTicekt[0]) + parseInt(myRespond.travelCost)))
                }else{
                    bestPriceListAll.set(myTicekt[0], parseInt(myRespond.travelCost))
                }
            }else{
                bestPriceListAll.set(myTicekt[0], parseInt(myTicekt[1]))
            }
        }
        
        bestPriceListAll.forEach((item, key) =>{
            if(bestPrice[1] == null){
                bestPrice[0] = key
                bestPrice[1] = item
            }else{
                if(bestPrice[1] > item){
                    bestPrice[0] = key
                    bestPrice[1] = item
                }
            }
        })

        bestTicketName.textContent = bestPrice[0]
        bestTicketCost.textContent = bestPrice[1]
    }

    // Helper function to send data to the server
    function sendDataToServer(route, data) {
        fetch(route, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })
            .then((response) => response.json())
            .then((result) => {
                updateResponseList(result);
            });
    }

    // Helper function to update the response list
    function updateResponseList(responses) {
        const myResponds = []
        for(response of responses){
            myResponds.push(JSON.parse(response))
        }
        setupBestTicket(myResponds)

        dataTable.innerHTML = myResponds
            .map((myRespond, index) => `
        <tr>
            <td>${myRespond.startStop}</td>
            <td>${myRespond.route}</td>
            <td>${myRespond.travelTicket}</td>
            <td>${myRespond.travelCost}</td>
            <td>${myRespond.travelDistance}</td>
            <td>${myRespond.weight}</td>
            <td>${myRespond.discountUsed}</td>
            <td><button class="delete-button" data-index="${index}">Törlés</button></td>
        </tr>
        `).join('');
    }

    // Helper function to delete an item from the list
    function deleteItemFromList(index) {
        fetch('/delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ index }),
        })
            .then((response) => response.json())
            .then((result) => {
                updateResponseList(result);
            });
    }
});
