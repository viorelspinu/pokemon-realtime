//https://obfuscator.io/


const SE_BACKGROUND = "#C62828";
const SE_TEXT_COLOR = "white";
const NVE_BACKGROUND = "#2E7D32";
const NVE_TEXT_COLOR = "white";
const REGULAR_BACKGROUND = "#AAA";
const REGULAR_TEXT_COLOR = "white";


var all_pokemon_data = null;
var my_selected_pokemons = [];
var enemy_data = null;
var show_all_moves = false;
var last_time_filter_enemy_touched = 0;
var filter_enemy_called_counter = 0;
var filtered_enemies = null;

var cup = "master";

$(function () {
    if (window.location.href.indexOf("rose") > 0) {
        cup = "rose";
    }
    if (window.location.href.indexOf("great") > 0) {
        cup = "great";
    }
    if (window.location.href.indexOf("master") > 0) {
        cup = "master";
    }
    if (window.location.href.indexOf("ultra") > 0) {
        cup = "ultra";
    }
    if (window.location.href.indexOf("txc") > 0) {
        cup = "toxic";
    }
    $("#select_league").val(cup);
    window.setInterval(selectAllFilterEnemies, 500);
});

$(function () {
    load_all_pokemon();
});

function select_league(league) {
    cup = league;
    load_all_pokemon();
}

function load_all_pokemon() {
    $.getJSON("/all-pokemon?cup=" + cup, function (data) {

        data = atob(data);
        let c = 0;
        let kk = [];
        for (let i = 0; i < 100; i++) {
            c = c + i;
            kk.push(c % 25 + 65);
        }
        let k1 = String.fromCharCode.apply(null, kk);
        data = x3932872321(data, k1);
        data = JSON.parse(data);

        data.sort((e1, e2) => {
            return e1.pokemon_data.name.localeCompare(e2.pokemon_data.name);
        });
        all_pokemon_data = data;
        render_all_pokemon_list(all_pokemon_data);

        fill_in_if_bookmarked();

    });
}


function x3932872321(text, key) {
    var kL = key.length;

    return Array.prototype
        .slice.call(text)
        .map(function (c, index) {
            return String.fromCharCode(c.charCodeAt(0) ^ key[index % kL].charCodeAt(0));
        }).join('');
}



function render_all_pokemon_list(data) {
    let data_comma = add_commas_charges(data);
    var template = document.getElementById('all_pokemon_template').innerHTML;
    var rendered = Mustache.render(template, data_comma);
    document.getElementById('all_pokemon_list').innerHTML = rendered;
}

function render_my_pokemon_list(data) {
    let data_comma = add_commas_charges(data);
    var template = document.getElementById('my_pokemon_template').innerHTML;
    var rendered = Mustache.render(template, data_comma);
    document.getElementById('my_pokemon_list').innerHTML = rendered;
}



function compute_vulnerabilities(data) {
    let new_data = $.extend(true, [], data);


    //compute vulnerabilities to enemy charge moves 
    new_data[0].enemy_data.pokemon.all_possible_moves.charge_moves.forEach(charge_move => {
        let charge_move_type = charge_move.type;
        if (charge_move_type) {
            new_data[0].counters.forEach(counter => {
                let v_total = 1;
                counter.types.forEach(type => {
                    let v = type_matrix[charge_move_type][type];
                    v_total = v_total * v;
                });
                if (!counter['vulnerabilities']) {
                    counter['vulnerabilities'] = {};
                }
                if (!counter['vulnerabilities']['charge']) {
                    counter['vulnerabilities']['charge'] = [];
                }
                let vulnerability = {}
                vulnerability['to'] = charge_move.name.replace(" ", "") + "(" + charge_move.type + ")";
                vulnerability['to_name'] = charge_move.name.replace(" ", "");
                vulnerability['to_type'] = charge_move.type;
                vulnerability['to_code'] = charge_move.code;
                vulnerability['to_base_power'] = round0(charge_move.base_power * v_total);
                vulnerability['class'] = '';
                if (v_total > 1) {
                    vulnerability['class'] = SE_BACKGROUND;
                    vulnerability['short_text'] = 'SE';
                    vulnerability['text_color'] = SE_TEXT_COLOR;
                }
                if (v_total == 1) {
                    vulnerability['class'] = REGULAR_BACKGROUND;
                    vulnerability['short_text'] = '';
                    vulnerability['text_color'] = REGULAR_TEXT_COLOR;
                }
                if (v_total < 1) {
                    vulnerability['class'] = NVE_BACKGROUND;
                    vulnerability['short_text'] = 'NVE';
                    vulnerability['text_color'] = NVE_TEXT_COLOR;
                }

                v_total = Math.round(v_total * 100) / 100;
                vulnerability['ammount'] = v_total;
                counter['vulnerabilities']['charge'].push(vulnerability);
            });
        }
    });

    //filter vulnerabilities to the most probable enemy charge moves (ignore the rest)
    new_data[0].counters.forEach(counter => {
        if (!show_all_moves) {
            if (new_data[0].enemy_data.pokemon.charge_moves.length > 1) {
                counter['vulnerabilities']['charge'] = counter['vulnerabilities']['charge'].filter(v => {
                    let existing_move = new_data[0].enemy_data.pokemon.charge_moves.find(cm => {
                        return cm.code.toLowerCase() == v.to_code.toLowerCase();

                    });
                    return (existing_move != null);
                });
            }
        }

        counter['vulnerabilities']['charge'].sort((v1, v2) => {
            return v2.ammount - v1.ammount;
        });
    });


    new_data[0].counters.forEach(counter => {
        let max_vulnerability = Math.max.apply(Math, counter['vulnerabilities']['charge'].map(vulnerability => { return vulnerability.ammount; }));
        if (max_vulnerability > 1) {
            counter['use_shield'] = true;

            let reason = "";
            counter['vulnerabilities']['charge'].forEach((v, index) => {
                if (v['ammount'] > 1) {
                    reason = reason + v['to'];
                    reason = reason + " or ";
                }
            });
            reason = reason.substring(0, reason.length - " or".length);
            counter['use_shield_reason'] = reason;

        }
        if (max_vulnerability < 1) {
            counter['do_not_use_shield'] = true;

            let max_vulnerability = Math.max.apply(Math, counter['vulnerabilities']['charge'].map(vulnerability => { return vulnerability.ammount; }));
            let reason = max_vulnerability;
            counter['use_shield_reason'] = reason;
        }
        if (max_vulnerability == 1) {
            counter['maybe_shield'] = true;

            let reason = "";
            counter['vulnerabilities']['charge'].forEach((v, index) => {
                if (v['ammount'] == 1) {
                    reason = reason + v['to'];
                    reason = reason + " or ";
                }
            });
            reason = reason.substring(0, reason.length - " or".length);
            counter['use_shield_reason'] = reason;

        }
    });


    //compute vulnerabilities to enemy fast moves 
    new_data[0].enemy_data.pokemon.all_possible_moves.fast_moves.forEach(fast_move => {
        let fast_move_type = fast_move.type;
        let fast_move_code = fast_move.code;
        let fast_move_base_power = fast_move.base_power;
        let fast_move_name = fast_move.name.replace(" ", "");
        new_data[0].counters.forEach(counter => {
            let v_total = 1;
            counter.types.forEach(type => {
                let v = type_matrix[fast_move_type][type];
                v_total = v_total * v;
            });
            if (!counter['vulnerabilities']) {
                counter['vulnerabilities'] = {};
            }
            if (!counter['vulnerabilities']['fast']) {
                counter['vulnerabilities']['fast'] = [];
            }
            let vulnerability = {}
            vulnerability['to'] = fast_move_name;
            vulnerability['to_code'] = fast_move_code;
            vulnerability['to_type'] = fast_move_type;
            vulnerability['to_base_power'] = round0(fast_move_base_power * v_total);

            vulnerability['class'] = '';
            if (v_total > 1) {
                vulnerability['class'] = SE_BACKGROUND;
                vulnerability['short_text'] = 'SE';
                vulnerability['text_color'] = SE_TEXT_COLOR;
            }
            if (v_total == 1) {
                vulnerability['class'] = REGULAR_BACKGROUND;
                vulnerability['short_text'] = '';
                vulnerability['text_color'] = REGULAR_TEXT_COLOR;
            }
            if (v_total < 1) {
                vulnerability['class'] = NVE_BACKGROUND;
                vulnerability['short_text'] = 'NVE';
                vulnerability['text_color'] = NVE_TEXT_COLOR;
            }
            v_total = Math.round(v_total * 100) / 100;
            vulnerability['ammount'] = v_total;

            counter['vulnerabilities']['fast'].push(vulnerability);

            counter['vulnerabilities']['fast'].sort((v1, v2) => {
                return v2.ammount - v1.ammount;
            });

        });
    });

    new_data[0].counters.forEach(counter => {
        if (!show_all_moves) {
            let enemy_quick_move_code = new_data[0].enemy_data.pokemon.quick_move.code;
            if (enemy_quick_move_code) {
                enemy_quick_move_code = enemy_quick_move_code.toLowerCase();
                counter['vulnerabilities']['fast'] = counter['vulnerabilities']['fast'].filter(v => {
                    return v['to_code'].toLowerCase() == enemy_quick_move_code;
                });

            }
        }

    });


    //compute enemy vulnerabilities to my pokemon charge moves    
    new_data[0].counters.forEach(counter => {
        if (!counter['attacks']) {
            counter['attacks'] = {};
        }
        counter['attacks']['charge'] = [];
        counter.all_possible_moves.charge_moves.forEach(my_pokemon_charge_move => {
            if (my_pokemon_charge_move.type) {
                let v_total = 1;
                new_data[0].enemy_data.pokemon.types.forEach(enemy_type => {
                    let v = type_matrix[my_pokemon_charge_move.type][enemy_type];
                    v_total = v_total * v;
                });
                let charge_attack = {}
                charge_attack['name'] = my_pokemon_charge_move.name.replace(" ", "");
                charge_attack['code'] = my_pokemon_charge_move.code;
                charge_attack['type'] = my_pokemon_charge_move.type;
                charge_attack['base_power'] = round0(my_pokemon_charge_move.base_power * v_total);

                if (v_total > 1) {
                    charge_attack['class'] = SE_BACKGROUND;
                    charge_attack['short_text'] = 'SE';
                    charge_attack['text_color'] = SE_TEXT_COLOR;
                }
                if (v_total == 1) {
                    charge_attack['class'] = REGULAR_BACKGROUND;
                    charge_attack['short_text'] = '';
                    charge_attack['text_color'] = REGULAR_TEXT_COLOR;
                }
                if (v_total < 1) {
                    charge_attack['class'] = NVE_BACKGROUND;
                    charge_attack['short_text'] = 'NVE';
                    charge_attack['text_color'] = NVE_TEXT_COLOR;
                }
                v_total = Math.round(v_total * 100) / 100;
                charge_attack['ammount'] = v_total;
                counter['attacks']['charge'].push(charge_attack);
            }
        });

        //filter enemy to just the charge moves my pokemon has (ignore the rest)
        if (counter.charge_moves.length > 0) {
            if (!show_all_moves) {
                counter['attacks']['charge'] = counter['attacks']['charge'].filter(a => {
                    let existing_move = counter.charge_moves.find(cm => {
                        return cm.code.toLowerCase() == a.code.toLowerCase();
                    });
                    return (existing_move != null);
                });
            }
        }

        counter['attacks']['charge'].sort((e1, e2) => {
            return e2['ammount'] - e1['ammount'];
        });
    });


    //compute enemy vulnerabilities to my pokemon fast moves    
    new_data[0].counters.forEach(counter => {
        if (!counter['attacks']) {
            counter['attacks'] = {};
        }
        counter['attacks']['fast'] = [];
        counter.all_possible_moves.fast_moves.forEach(my_pokemon_fast_move => {
            if (my_pokemon_fast_move.type) {
                let v_total = 1;
                new_data[0].enemy_data.pokemon.types.forEach(enemy_type => {
                    let v = type_matrix[my_pokemon_fast_move.type][enemy_type];
                    v_total = v_total * v;
                });
                let fast_attack = {}
                fast_attack['name'] = my_pokemon_fast_move.name.replace(" ", "");
                fast_attack['code'] = my_pokemon_fast_move.code;
                fast_attack['type'] = my_pokemon_fast_move.type;
                fast_attack['base_power'] = round0(my_pokemon_fast_move.base_power * v_total);

                if (v_total > 1) {
                    fast_attack['class'] = SE_BACKGROUND;
                    fast_attack['short_text'] = 'SE';
                    fast_attack['text_color'] = SE_TEXT_COLOR;
                }
                if (v_total == 1) {
                    fast_attack['class'] = REGULAR_BACKGROUND;
                    fast_attack['short_text'] = '';
                    fast_attack['text_color'] = REGULAR_TEXT_COLOR;
                }
                if (v_total < 1) {
                    fast_attack['class'] = NVE_BACKGROUND;
                    fast_attack['short_text'] = 'NVE';
                    fast_attack['text_color'] = NVE_TEXT_COLOR;
                }
                v_total = Math.round(v_total * 100) / 100;
                fast_attack['ammount'] = v_total;
                counter['attacks']['fast'].push(fast_attack);
            }
        });

        //filter enemy to just the charge moves my pokemon has (ignore the rest)        
        if (counter.quick_move) {
            if (!show_all_moves) {
                counter['attacks']['fast'] = counter['attacks']['fast'].filter(a => {
                    return (counter.quick_move.code.toLowerCase() == a.code.toLowerCase());
                });
            }
        }

        counter['attacks']['fast'].sort((e1, e2) => {
            return e2['ammount'] - e1['ammount'];
        });
    });

    return new_data;
}

function render_filtered_names(filtered_data) {
    let names = "";
    let index = 1;
    filtered_data.forEach(entry => {
        if (index < 5) {
            names = names + " <span class='badge badge-primary'>[" + index + "]</span> " + entry.enemy_data.pokemon.name + ", ";
        }
        index = index + 1;

    });
    names = names.substring(0, names.length - 2);
    if (names.length == 0) {
        names = "?";
    }
    $("#filtered_names").html(names);
}

function render_best_choice(data) {

    let can_render = true;
    if (data.length == 0) {
        can_render = false;
    }
    if (data.length > 20) {
        can_render = false;
    }

    if (!can_render) {
        $("#enemy_primary").hide();
        $("#enemy_secondary").show();
        $('.counters').addClass("badge-secondary");
        $('.counters').removeClass("badge-primary");
        $('.counter_progress_bar').addClass("bg-secondary");
        $('.counter_progress_bar').removeClass("bg-primary");

        return;
    }

    gtag('event', "BATTLE_SEARCH", {
        'event_category': "BATTLE",
        'event_label': data[0].enemy_data.pokemon.name,
        'value': 0
    });

    let new_data = compute_vulnerabilities(data);
    let template_data = new_data[0];
    template = document.getElementById('best_choice_template_condensed').innerHTML;
    var rendered = Mustache.render(template, template_data);
    document.getElementById('best_choice').innerHTML = rendered;

    template = document.getElementById('enemy_data_template').innerHTML;
    var rendered = Mustache.render(template, template_data);
    document.getElementById('enemy_data').innerHTML = rendered;

    $("#enemy_primary").show();
    $("#enemy_secondary").hide();
    $('.counters').addClass("badge-primary");
    $('.counters').removeClass("badge-secondary");
    $('.counter_progress_bar').addClass("bg-primary");
    $('.counter_progress_bar').removeClass("bg-secondary");
}

function add_to_my_pokemons(pokemon_id) {
    filter_all_pokemons();
    let my_pokemon = all_pokemon_data.find(element => {
        return (element.pokemon_data.id == pokemon_id);
    });
    my_selected_pokemons.push(my_pokemon);
    if (my_selected_pokemons.length >= 3) {
        $("#start_battle_button_div").show();
        $("#choose_your_team_button_div").hide();
        $("#choose_pokemon_arrow").hide();
        $("#start_battle_arrow").show();
        window.scrollTo(0, 0);
    }

    render_my_pokemon_list(my_selected_pokemons);
    fill_in_team_url(my_selected_pokemons);
}

function fill_in_team_url(my_selected_pokemons) {
    let port = "";
    if (window.location.port != 80) {
        port = ":" + window.location.port;
    }
    let team_url = window.location.protocol + "//" + window.location.hostname + port + "/app?team=";
    my_selected_pokemons.forEach(p => {
        team_url = team_url + p.file.replace(".json", "") + ",";
    });
    if (my_selected_pokemons.length > 0) {
        $("#team_url").show();
    } else {
        $("#team_url").hide();
    }
    team_url = team_url + "&cup=" + cup;
    $("#team_url").val(team_url);
}

function remove_my_pokemon(pokemon_id) {
    let pokemon_div_list_id = "pokemon_" + pokemon_id;
    $("#" + pokemon_div_list_id).show();
    my_selected_pokemons = my_selected_pokemons.filter(element => {
        return (element.pokemon_data.id != pokemon_id);
    });

    render_my_pokemon_list(my_selected_pokemons);
    fill_in_team_url(my_selected_pokemons);
}

function add_commas_charges(data) {
    let new_data = $.extend(true, [], data);
    return new_data.map(e => {
        if (e.pokemon_data.charge_moves.length == 2) {
            e.pokemon_data.charge_moves[0].name = e.pokemon_data.charge_moves[0].name + ", ";
        }
        return e;
    });
}

function compute_enemy_data(my_pokemon_data) {
    let enemy_data = [];
    console.log(my_pokemon_data);

    let enemy_ids = [];
    for (let i = 0; i < my_pokemon_data[0].performance.length; i++) {
        let enemy_id_0 = my_pokemon_data[0].performance[i].pokemon.id;
        enemy_ids.push(enemy_id_0);
    }

    let index = 0;
    enemy_ids.forEach(e_id => {
        my_pokemon_data.forEach(p_data => {
            let e_data = p_data.performance.filter(d => {
                return (d.pokemon.id == e_id);
            });

            let new_data = $.extend(true, [], p_data.pokemon);

            if (e_data[0]) {
                new_data.rating = e_data[0].rating;

                if (!enemy_data[index]) {
                    enemy_data[index] = {};
                }
                if (!enemy_data[index].counters) {
                    enemy_data[index].counters = [];
                }
                enemy_data[index].counters.push(new_data);
                enemy_data[index].enemy_data = e_data[0];
            }
        });

        let enemy_data_row = enemy_data[index];

        enemy_data_row.counters.sort((c1, c2) => {
            return (c2.rating - c1.rating);
        });
        index = index + 1;
    });

    return enemy_data;


}

function start_battle() {
    $("#pokemon_table").html("loading data, please wait...");
    $("#choose_party_div").hide();
    $("#search_div").show();
    $(".navbar_element").hide();
    $("body").css('padding-top', '3px');

    window.history.pushState(null, null, $("#team_url").val());


    let my_pokemon_files = "";
    my_selected_pokemons.forEach(p => {
        my_pokemon_files = my_pokemon_files + "," + p.file.replace('.json', '');
    });
    my_pokemon_files = my_pokemon_files.substring(1);
    gtag('event', "BATTLE_START", {
        'event_category': "BATTLE",
        'event_label': my_pokemon_files,
        'value': 0
    });
    $.getJSON("/my-pokemon?cup=" + cup + "&files=" + my_pokemon_files, function (data) {
        data = atob(data);
        let c = 0;
        let kk = [];
        for (let i = 0; i < 100; i++) {
            c = c + i;
            kk.push(c % 25 + 65);
        }
        let k1 = String.fromCharCode.apply(null, kk);
        data = x3932872321(data, k1);
        data = JSON.parse(data);
        enemy_data = compute_enemy_data(data);
        filter_enemies();
    });
}


function filter_enemies() {
    last_time_filter_enemy_touched = getMillis();
    let filter_value = $("#search_text").val().toLowerCase();
    let last_char = filter_value.substr(filter_value.length - 1);
    if (last_char >= '0' && last_char <= '9') {
        if (filtered_enemies) {
            let index = parseInt(last_char);
            if (filtered_enemies.length >= index) {
                $("#search_text").val(filtered_enemies[index - 1].enemy_data.pokemon.name);
                window.setTimeout(filter_enemies, 100);
            }
        }
    }

    filtered_enemies = enemy_data.filter(e => {
        return (e.enemy_data.pokemon.id.indexOf(filter_value) == 0);
    });

    render_filtered_names(filtered_enemies);
    render_best_choice(filtered_enemies);

    filter_enemy_called_counter++;
    if (filter_enemy_called_counter > 5) {
        $("#search_here_arrow").hide();
    }

}

function selectAllFilterEnemies() {
    if ((getMillis() - last_time_filter_enemy_touched) > 3000) {
        $("#search_text").select();
        last_time_filter_enemy_touched = getMillis();
    }
}

function getMillis() {
    let d = new Date();
    let n = d.getTime();
    return n;
}


function filter_all_pokemons() {
    let filter_value = $("#filter_all_pokemons").val().toLowerCase();
    filtered_data = all_pokemon_data.filter(e => {
        return (e.pokemon_data.id.indexOf(filter_value) == 0);
    });
    render_all_pokemon_list(filtered_data);
}



function set_show_all_moves(show) {
    show_all_moves = show;
    filter_enemies();
}


function fill_in_if_bookmarked() {
    let bookmarked_pokemons = getBookmarkedPokemonList();
    if (bookmarked_pokemons.length == 0) {
        return;
    }

    bookmarked_pokemons.forEach(bp => {
        add_to_my_pokemons(bp.pokemon_data.id);
    });
    window.setTimeout(() => { window.scrollTo(0, 0); }, 500);


}

function getBookmarkedPokemonList() {

    let my_selected_pokemons = [];

    const urlParams = new URLSearchParams(window.location.search);
    const team_string = urlParams.get('team');
    if (!team_string) {
        return my_selected_pokemons;
    }
    let team_id_list = team_string.split(',');
    team_id_list = team_id_list.filter(p => p.length > 0);

    team_id_list.forEach(p => {
        let full_pokemon = all_pokemon_data.find(element => {
            return (element.file == p + ".json");
        });
        my_selected_pokemons.push(full_pokemon);
    });


    return my_selected_pokemons;
}

function round0(val) {
    return Math.round(val * 1) / 1
}


var type_matrix = [];
