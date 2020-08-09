
function levenshteinDistance(a, b) {

    a = a.toLowerCase();
    b = b.toLowerCase();

    const distanceMatrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
    for (let i = 0; i <= a.length; i += 1) {
        distanceMatrix[0][i] = i;
    }
    for (let j = 0; j <= b.length; j += 1) {
        distanceMatrix[j][0] = j;
    }

    for (let j = 1; j <= b.length; j += 1) {
        for (let i = 1; i <= a.length; i += 1) {
            const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
            distanceMatrix[j][i] = Math.min(
                distanceMatrix[j][i - 1] + 1, // deletion
                distanceMatrix[j - 1][i] + 1, // insertion
                distanceMatrix[j - 1][i - 1] + indicator, // substitution
            );
        }
    }

    return distanceMatrix[b.length][a.length];
}

function computeCounterPokemon(enemy) {
    if ("____NOTHING____" == enemy) {
        return;
    }

    let minDistance = 9999999;
    let enemyData = null;
    pokemonList.data.slice(1).forEach(element => {
        let distance = levenshteinDistance(element[0], enemy);
        if (distance < minDistance) {
            minDistance = distance;
            enemyData = element;
        }
    });
    let sortedCounters = [];
    for (let i = 0; i < 3; i++) {
        sortedCounters[i] = [];
        sortedCounters[i][0] = pokemonList.data[0][i + 1];
        sortedCounters[i][1] = enemyData[i + 1];
    }
    sortedCounters.sort((e1, e2) => {
        return e1[1] - e2[1];
    })

    let sortedCountersString = "";
    sortedCounters.forEach(elem => {
        sortedCountersString = sortedCountersString + elem[0] + " - " + elem[1] + "<br>";
    });

    $("#recognized").html($("#recognized").html() + " --> " + enemyData[0]);
    $("#counter").html(sortedCountersString);
    websocket.send("__SAY__TEXT__" + "for " + enemyData[0] + " use " + sortedCounters[0]);


}

function parsePokemons() {
    pokemonList = Papa.parse($("#pokemons").val());

    pokemonList.data = pokemonList.data.map(element => {
        let elementNoSpaces = element[0].trim().split(" ")[0];
        element[0] = elementNoSpaces;
        return element;
    });
    pokemonList.data[0][1] = pokemonList.data[0][1].trim().split(" ")[0];
    pokemonList.data[0][2] = pokemonList.data[0][2].trim().split(" ")[0];
    pokemonList.data[0][3] = pokemonList.data[0][3].trim().split(" ")[0];


    let tableHtml = "<table>";
    pokemonList.data.slice(1).forEach(element => {
        tableHtml = tableHtml + "<tr>";
        let elementNoSpaces = element[0];
        tableHtml = tableHtml + "<td style='cursor: pointer;color:blue' onclick='websocket.send(\"__SAY__TEXT__" + element[0] + "\");'>";
        tableHtml = tableHtml + elementNoSpaces;
        tableHtml = tableHtml + "</td>";
        tableHtml = tableHtml + "<td>";
        tableHtml = tableHtml + element[1];
        tableHtml = tableHtml + "</td>";
        tableHtml = tableHtml + "<td>";
        tableHtml = tableHtml + element[2];
        tableHtml = tableHtml + "</td>";
        tableHtml = tableHtml + "<td>";
        tableHtml = tableHtml + element[3];
        tableHtml = tableHtml + "</td>";

        tableHtml = tableHtml + "</tr>";
    });

    tableHtml = tableHtml + "</table>";

    $("#inputArea").hide();

    $("#pokemonTable").html(tableHtml);

    pokemonListParsed = true;

}