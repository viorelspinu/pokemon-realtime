from time import sleep
import base64
import requests
import os
import time
import os.path
from google.cloud import speech_v1p1beta1
from google.cloud import texttospeech
import io
from time import sleep
from google.cloud.speech_v1p1beta1 import enums
import logging
log = logging.getLogger('werkzeug')

class GoogleCloudService:

    def __init__(self):
        print("INIT")

    def do_text_to_speech(self, text):
        client = texttospeech.TextToSpeechClient()
        synthesis_input = texttospeech.types.SynthesisInput(text=text)
        voice = texttospeech.types.VoiceSelectionParams(
            language_code='en-US',
            ssml_gender=texttospeech.enums.SsmlVoiceGender.NEUTRAL)
        audio_config = texttospeech.types.AudioConfig(audio_encoding=texttospeech.enums.AudioEncoding.MP3)        
        response = client.synthesize_speech(synthesis_input, voice, audio_config)
        return response.audio_content

                


    def do_speech_to_text_post(self, audio_content, language_code):

    
        client = speech_v1p1beta1.SpeechClient()
        enable_word_confidence = True

        phrases = ["Abomasnow","Absol","Accelgor","Aerodactyl","Aggron","Aipom","Alakazam","Altaria","Ambipom","Amoonguss","Ampharos","Anorith","Arbok","Arcanine","Archen","Archeops","Ariados","Armaldo","Aron","Articuno","Axew","Azelf","Azumarill","Banette","Basculin","Bastiodon","Bayleef","Beartic","Beautifly","Beedrill","Bellossom","Bibarel","Blastoise","Blaziken","Blissey","Boldore","Bonsly","Breloom","Bronzong","Buneary","Butterfree","Cacturne","Camerupt","Carnivine","Carracosta","Castform","Castform","Castform","Castform","Celebi","Chandelure","Chansey","Charizard","Charmeleon","Chatot","Cherrim","Cherrim","Chimecho","Chinchou","Cinccino","Clamperl","Claydol","Clefable","Clefairy","Cloyster","Cofagrigus","Combusken","Conkeldurr","Corsola","Cradily","Cranidos","Crawdaunt","Cresselia","Crobat","Croconaw","Crustle","Cryogonal","Cubone","Darmanitan","Darumaka","Delcatty","Deoxys","Deoxys","Dewgong","Dewott","Dodrio","Donphan","Dragonair","Dragonite","Drapion","Drifblim","Drifloon","Drilbur","Drowzee","Dugtrio","Dugtrio","Dunsparce","Durant","Dusclops","Dusknoir","Dustox","Dwebble","Electabuzz","Electivire","Electrode","Emboar","Empoleon","Entei","Escavalier","Espeon","Excadrill","Exeggcute","Exeggutor","Exeggutor","Exploud","Farfetch'd","Fearow","Feraligatr","Ferrothorn","Flaaffy","Flareon","Floatzel","Flygon","Forretress","Fraxure","Froslass","Furret","Gabite","Gallade","Galvantula","Garbodor","Garchomp","Gardevoir","Gastrodon","Gastrodon","Gengar","Geodude","Geodude","Gigalith","Girafarig","Glaceon","Glalie","Gligar","Gliscor","Gloom","Golbat","Golduck","Golem","Golem","Golett","Golurk","Gorebyss","Granbull","Graveler","Graveler","Grimer","Grimer","Grotle","Grovyle","Growlithe","Grumpig","Gurdurr","Gyarados","Hariyama","Haunter","Haxorus","Heatmor","Heracross","Herdier","Hippopotas","Hippowdon","Hitmonchan","Hitmonlee","Hitmontop","Ho-Oh","Honchkrow","Houndoom","Huntail","Hydreigon","Hypno","Illumise","Infernape","Ivysaur","Jirachi","Jolteon","Jumpluff","Jynx","Kabuto","Kabutops","Kadabra","Kangaskhan","Kingdra","Kingler","Klang","Klinklang","Koffing","Krabby","Kricketune","Lairon","Lampent","Lanturn","Lapras","Latias","Latios","Leafeon","Ledian","Lickilicky","Lickitung","Liepard","Lileep","Linoone","Lombre","Lopunny","Loudred","Lucario","Ludicolo","Lugia","Lumineon","Lunatone","Luxio","Luxray","Machamp","Machoke","Machop","Magby","Magcargo","Magmar","Magmortar","Magnemite","Magneton","Magnezone","Mamoswine","Manectric","Mantine","Mantyke","Maractus","Marowak","Marowak","Marshtomp","Masquerain","Mawile","Medicham","Meganium","Melmetal","Mesprit","Metagross","Metang","Mew","Mightyena","Milotic","Miltank","Minun","Misdreavus","Mismagius","Moltres","Monferno","Mothim","Mr.","Muk","Muk","Munchlax","Murkrow","Nidoking","Nidoqueen","Nidorina","Nidorino","Ninetales","Ninetales","Ninjask","Noctowl","Nosepass","Nuzleaf","Octillery","Oddish","Omanyte","Omastar","Onix","Pachirisu","Palpitoad","Parasect","Pelipper","Persian","Persian","Phanpy","Pidgeot","Pidgeotto","Pignite","Piloswine","Pineco","Pinsir","Plusle","Politoed","Poliwhirl","Poliwrath","Ponyta","Porygon","Porygon-Z","Porygon2","Primeape","Prinplup","Probopass","Pupitar","Purugly","Quagsire","Quilava","Qwilfish","Raichu","Raichu","Raikou","Rampardos","Rapidash","Raticate","Raticate","Regice","Regigigas","Regirock","Registeel","Relicanth","Rhydon","Rhyhorn","Rhyperior","Roggenrola","Roselia","Roserade","Sableye","Salamence","Samurott","Sandshrew","Sandshrew","Sandslash","Sandslash","Sawk","Sceptile","Scizor","Scolipede","Scrafty","Scraggy","Scyther","Seadra","Seaking","Sealeo","Seismitoad","Serperior","Servine","Seviper","Sharpedo","Shelgon","Shellos","Shellos","Shiftry","Sigilyph","Simipour","Simisage","Simisear","Skarmory","Skuntank","Slaking","Slowbro","Slowking","Slowpoke","Smoochum","Sneasel","Snorlax","Snover","Snubbull","Solrock","Spinda","Spiritomb","Spoink","Stantler","Staraptor","Staravia","Starmie","Steelix","Stoutland","Sudowoodo","Suicune","Sunflora","Swalot","Swampert","Swellow","Swoobat","Tangela","Tangrowth","Tauros","Teddiursa","Tentacruel","Throh","Timburr","Tirtouga","Togekiss","Togetic","Torkoal","Tornadus","Torterra","Toxicroak","Tranquill","Tropius","Turtwig","Typhlosion","Tyranitar","Umbreon","Unfezant","Ursaring","Uxie","Vaporeon","Venomoth","Venusaur","Vespiquen","Vibrava","Victreebel","Vigoroth","Vileplume","Volbeat","Wailmer","Wailord","Walrein","Wartortle","Watchog","Weavile","Weepinbell","Weezing","Weezing","Whirlipede","Whiscash","Wigglytuff","Wobbuffet","Wormadam","Wormadam","Wormadam","Xatu","Yanma","Yanmega","Zangoose","Zapdos","Zebstrika","Zweilous"]
        boost = 10000.0
        speech_contexts_element = {"phrases": phrases, "boost": boost}
        speech_contexts = [speech_contexts_element]

        language_code = "en-US"
        encoding = enums.RecognitionConfig.AudioEncoding.LINEAR16
      
        model = "command_and_search"
        use_enhanced = True


        config = {
            "encoding": encoding,
            "model": model,
            "use_enhanced": use_enhanced,
            "speech_contexts": speech_contexts,
            "enable_word_confidence": enable_word_confidence,
            "language_code": language_code,
            'sample_rate_hertz': 44100,
            "audio_channel_count":2,
        }
        audio = {"content": audio_content}
            
        response = client.recognize(config, audio)
                
        if (response.results):
            if (len(response.results) > 0):
                if (response.results[0].alternatives):
                    if (len(response.results[0].alternatives) > 0):
                        return response.results[0].alternatives[0].transcript

        return "____NOTHING____"

