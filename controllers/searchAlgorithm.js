let timeStart = performance.now();

const EASTCONNECTIONS = __dirname + "/eastStations.txt"
const WESTCONNECTIONS = __dirname + "/westStations.txt"

const fs = require('fs')

var eastStations = new Map()
var westStations = new Map()
var discounts = new Map()

var availableTickets = new Map()
var queue = []
var selectedDiscount = 'Nem használ'

function ticketOb(name, price, priceMultiplier) {
    this.name = name
    this.price = parseInt(price)
    this.priceMultiplier = priceMultiplier
}

function discountOb(name, percent) {
    this.name = name
    this.percent = parseFloat(percent)
}

function stationOb(name) {
    this.name = name
    this.nearbyStations = new Map()
}

function nodeOb(route, travelTicket, travelDistance, travelCost, weight) {
    this.route = route
    this.travelTicket = travelTicket
    this.travelDistance = travelDistance
    this.travelCost = travelCost
    this.weight = weight
}


function binarySearch(value, start, end) {
    if (start == queue.length) {
        return queue.length
    }

    let middle = Math.floor((start + end) / 2)

    if (queue[middle].weight == value || start == end) {
        return middle
    }

    if (queue[middle].weight > value) {
        return binarySearch(value, start, middle)
    }

    if (queue[middle].weight < value) {
        middle += 1
        return binarySearch(value, middle, end)
    }
}

function partition(array, low, high) {
    let pivot = array[high].weight
    let i = low - 1
    for (let j = low; j < high; j++) {
        if (array[j].weight <= pivot) {
            i++
            [array[i], array[j]] = [array[j], array[i]]
        }
    }

    [array[i + 1], array[high]] = [array[high], array[i + 1]]

    return i + 1
}

function quickSort(array, low, high) {
    if (low < high) {
        let pivot = partition(array, low, high)
        quickSort(array, low, pivot - 1)
        quickSort(array, pivot + 1, high)
    }
}

function generateStartQueue(start, allStation, costWeight, distanceWeight) {
    let myQueue = []
    let possibleStations = allStation.get(start).nearbyStations.keys()

    for (let nextStation of possibleStations) {
        for (let ticket of Array.from(availableTickets.values())) {
            let myTravelTicket = [Object.assign({}, ticket)]
            let myDistance = allStation.get(start).nearbyStations.get(nextStation)
            let myCost = 0

            if (ticket.priceMultiplier) {
                myCost = myDistance * ticket.price
                myTravelTicket[0].price = myCost
            } else {
                myCost = ticket.price
                myTravelTicket[0].price = myCost
            }

            let myWeight = Math.ceil(myCost * costWeight + myDistance * distanceWeight)
            let myRoute = [start, nextStation]

            myQueue.push(new nodeOb(myRoute, myTravelTicket, myDistance, myCost, myWeight))
        }
    }

    quickSort(myQueue, 0, myQueue.length - 1)
    return myQueue
}

function interBFS(start, destination, allStation, costWeight, distanceWeight) {
    let myQueue = generateStartQueue(start, allStation, costWeight, distanceWeight)

    while (myQueue.length > 0) {
        let currentNode = myQueue.shift()
        let currentStation = currentNode.route[currentNode.route.length - 1]

        if (currentStation == destination) {
            if (queue.length > 0) {
                let i = binarySearch(currentNode.weight, 0, queue.length - 1)
                queue.splice(i, 0, currentNode)
            } else {
                queue.push(currentNode)
            }
        } else {
            let possibleStations = Array.from(allStation.get(currentStation).nearbyStations.keys())

            for (let nextStation of possibleStations) {
                if (!currentNode.route.includes(nextStation) && currentNode.route.length < 8 && (Array.from(allStation.get(nextStation).nearbyStations.keys()).length > 1 || nextStation == destination)) {
                    let nextStationDistance = allStation.get(currentStation).nearbyStations.get(nextStation)
                    let myTravelTicket = currentNode.travelTicket.slice()
                    let myDistance = currentNode.travelDistance + nextStationDistance

                    let myRoute = currentNode.route.slice()
                    let myWeight = currentNode.weight
                    let myCost = 0

                    if (myTravelTicket[0].priceMultiplier) {
                        let newTicket = Object.assign({}, availableTickets.get(myTravelTicket[0].name))
                        myCost += nextStationDistance * newTicket.price
                        newTicket.price = myCost
                        myTravelTicket.push(newTicket)
                    }

                    myWeight += Math.ceil(myCost * costWeight + nextStationDistance * distanceWeight)
                    myCost += currentNode.travelCost
                    myRoute.push(nextStation)
                    myQueue.push(new nodeOb(myRoute, myTravelTicket, myDistance, myCost, myWeight))

                }
            }
        }
    }
}

function bfsCost(start, destination, allStation, costWeight, distanceWeight) {
    let cheapestRoute = new Map()

    for (let x of availableTickets.keys()) {
        cheapestRoute.set(x, null)
    }

    if (queue.length == 0) {
        queue = generateStartQueue(start, allStation, costWeight, distanceWeight)
    }

    while (true) {
        let currentNode = queue.shift()

        if (cheapestRoute.get(currentNode.travelTicket[0].name) == null) {
            let currentStation = currentNode.route[currentNode.route.length - 1]

            if (currentStation == destination) {
                cheapestRoute.set(currentNode.travelTicket[0].name, currentNode)
                if (!Array.from(cheapestRoute.values()).includes(null)) {
                    return cheapestRoute
                }
            } else {
                let possibleStations = Array.from(allStation.get(currentStation).nearbyStations.keys())

                for (let nextStation of possibleStations) {
                    if (!currentNode.route.includes(nextStation) && currentNode.route.length < 16 && (Array.from(allStation.get(nextStation).nearbyStations.keys()).length > 1 || nextStation == destination)) {
                        let nextStationDistance = allStation.get(currentStation).nearbyStations.get(nextStation)
                        let myTravelTicket = currentNode.travelTicket.slice()
                        let myDistance = currentNode.travelDistance + nextStationDistance

                        let myRoute = currentNode.route.slice()
                        let myWeight = currentNode.weight
                        let myCost = 0

                        if (myTravelTicket[0].priceMultiplier) {
                            let newTicket = Object.assign({}, availableTickets.get(myTravelTicket[0].name))
                            myCost += nextStationDistance * newTicket.price
                            newTicket.price = myCost
                            myTravelTicket.push(newTicket)
                        }

                        myWeight += Math.ceil(myCost * costWeight + nextStationDistance * distanceWeight)
                        myCost += currentNode.travelCost
                        myRoute.push(nextStation)

                        let i = binarySearch(myWeight, 0, queue.length) // !!! We don't need length-1 here !!!
                        queue.splice(i, 0, new nodeOb(myRoute, myTravelTicket, myDistance, myCost, myWeight))
                    }
                }
            }
        }
    }
}

function searchRoute(start, end, costWeight, distanceWeight) {
    queue = []
    let cheapestRoute

    if (Array.from(eastStations.keys()).includes(start) && Array.from(eastStations.keys()).includes(end)) {
        cheapestRoute = bfsCost(start, end, eastStations, costWeight, distanceWeight)
    } else
        if (Array.from(westStations.keys()).includes(start) && Array.from(westStations.keys()).includes(end)) {
            cheapestRoute = bfsCost(start, end, westStations, costWeight, distanceWeight)
        } else
            if (Array.from(eastStations.keys()).includes(start) && Array.from(westStations.keys()).includes(end)) {
                interBFS(start, "Budapest", eastStations, costWeight, distanceWeight)
                console.log(queue.length)
                interBFS(start, "Kiskunfélegyháza", eastStations, costWeight, distanceWeight)
                console.log(queue.length)

                cheapestRoute = bfsCost(null, end, westStations, costWeight, distanceWeight)
            } else
                if (Array.from(westStations.keys()).includes(start) && Array.from(eastStations.keys()).includes(end)) {
                    interBFS(start, "Budapest", westStations, costWeight, distanceWeight)
                    console.log(queue.length)
                    interBFS(start, "Kiskunfélegyháza", westStations, costWeight, distanceWeight)
                    console.log(queue.length)

                    cheapestRoute = bfsCost(null, end, eastStations, costWeight, distanceWeight)
                }

    availableTickets.set("Országbérlet", new ticketOb("Országbérlet", 12000, false))
    availableTickets.set("Vonaljegy", new ticketOb("Vonaljegy", 25, true))

    // Convert cheapestRoute object into JSON format for further use and return it
    selectedRoutesInString = []
    for (let item of Array.from(cheapestRoute.values())) {

        let myObject = {}
        let myStr = ""

        myStr += `${item.route[0]}-${item.route[item.route.length - 1]}`
        myObject.startStop = myStr

        myStr = ""
        for (let i = 0; i < item.route.length; i++) {
            if (i < item.route.length - 1) {
                myStr += `${item.route[i]} : `
            } else {
                myStr += `${item.route[i]}`
            }
        }
        myObject.route = myStr

        myStr = ""
        for (let i = 0; i < item.travelTicket.length; i++) {
            if (i < item.travelTicket.length - 1) {
                myStr += `${item.travelTicket[i].name}-${item.travelTicket[i].price}, `
            } else {
                myStr += `${item.travelTicket[i].name}-${item.travelTicket[i].price}`
            }
        }
        myObject.travelTicket = myStr
        myObject.priceMultiplier = item.travelTicket[0].priceMultiplier
        myObject.travelDistance = item.travelDistance
        myObject.travelCost = item.travelCost
        myObject.weight = item.weight
        myObject.discountUsed = `${selectedDiscount}`

        selectedRoutesInString.push(myObject)
    }
    return selectedRoutesInString

}

function calculateDiscount(myDiscounts) {
    let max = 0
    selectedDiscount = 'Nem használ'
    if (myDiscounts.length > 0) {
        for (let x of myDiscounts) {
            let currentDiscount = discounts.get(x).percent
            if (currentDiscount > max) {
                max = currentDiscount
                selectedDiscount = discounts.get(x).name
            }
        }

        for (let item of availableTickets.values()) {
            item.price = Math.ceil(item.price * (1 - (max / 100.0)))
        }
    }
}

function addStation(station, stationList) {
    if (!Array.from(stationList.keys()).includes(station)) {
        stationList.set(station, new stationOb(station))
    }
}

function initialize() {

    let data = fs.readFileSync(EASTCONNECTIONS, 'utf8')
    let lines = data.split("\n")

    for (let x of lines) {
        let oneLine = x.trim().split(", ")
        addStation(oneLine[0], eastStations)
        addStation(oneLine[1], eastStations)

        eastStations.get(oneLine[0]).nearbyStations.set(oneLine[1], parseInt(oneLine[2]))
        eastStations.get(oneLine[1]).nearbyStations.set(oneLine[0], parseInt(oneLine[2]))
    }

    data = fs.readFileSync(WESTCONNECTIONS, 'utf8');
    lines = data.split("\n")

    for (let x of lines) {
        let oneLine = x.trim().split(", ")
        addStation(oneLine[0], westStations)
        addStation(oneLine[1], westStations)

        westStations.get(oneLine[0]).nearbyStations.set(oneLine[1], parseInt(oneLine[2]))
        westStations.get(oneLine[1]).nearbyStations.set(oneLine[0], parseInt(oneLine[2]))
    }

    availableTickets.set("Országbérlet", new ticketOb("Országbérlet", 12000, false))
    availableTickets.set("Vonaljegy", new ticketOb("Vonaljegy", 25, true))


    discounts.set("Diák - 50%", new discountOb("Diák - 50%", 50))
    discounts.set("Sérült - 90%", new discountOb("Sérült - 90%", 90))
    discounts.set("MávStart Kártya - Díjmentes", new discountOb("MávStart Kártya - Díjmentes", 100))

}

function testRun() {
    var travels = []

    calculateDiscount(["Diák - 50%", "Sérült - 90%", "MávStart Kártya - Díjmentes"])

    travels.push(searchRoute("Sopron", "Záhony", 1, 0))
    // travels.push(searchRoute("Sopron", "Záhony", 0, 1))
    // travels.push(searchRoute("Sopron", "Záhony", 0.001, 0.999))
    // travels.push(searchRoute("Sopron", "Záhony", 0.999, 0.001))
    // travels.push(searchRoute("Zalaegerszeg", "Záhony", 1, 0))

    for (let i = 0; i < travels.length; i++) {
        console.log(travels[i])
        console.log("--------------------------------------------")
    }

    console.log(`${performance.now() - timeStart} ms`)
}

initialize()
//testRun()

module.exports.searchRoute = searchRoute
module.exports.testRun = testRun
module.exports.calculateDiscount = calculateDiscount