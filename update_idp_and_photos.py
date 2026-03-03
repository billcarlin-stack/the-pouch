import os
import re

hawthorn_players = [
    (1, "Harry Morrison", 90, "Mid/Def"),
    (2, "Mitchell Lewis", 75, "Key Forward"),
    (3, "Jai Newcombe", 60, "Midfielder"),
    (4, "Jarman Impey", 180, "Defender"),
    (5, "James Worpel", 110, "Midfielder"),
    (6, "James Sicily", 140, "Defender"),
    (7, "Ned Reeves", 45, "Ruck"),
    (8, "Sam Frost", 160, "Key Def"),
    (9, "Changkuoth Jiath", 50, "Def/Mid"),
    (10, "Karl Amon", 140, "Midfielder"),
    (11, "Conor Nash", 85, "Midfielder"),
    (12, "Will Day", 60, "Mid/Def"),
    (13, "Dylan Moore", 80, "Forward"),
    (14, "Jack Scrimshaw", 85, "Defender"),
    (15, "Blake Hardwick", 150, "Defender"),
    (16, "Massimo D'Ambrosio", 15, "Def/Mid"),
    (17, "Lloyd Meek", 30, "Ruck"),
    (18, "Mabior Chol", 65, "Key Forward"),
    (19, "Jack Ginnivan", 45, "Forward"),
    (20, "Chad Wingard", 220, "Forward"),
    (21, "Nick Watson", 10, "Forward"),
    (22, "Luke Breust", 285, "Forward"),
    (23, "Josh Weddle", 20, "Defender"),
    (24, "Denver Grainger-Barras", 30, "Key Def"),
    (25, "Josh Ward", 35, "Midfielder"),
    (26, "Bodie Ryan", 0, "Defender"),
    (27, "Will McCabe", 0, "Key Def"),
    (28, "Cam Mackenzie", 15, "Midfielder"),
    (29, "Jai Serong", 10, "Mid/Fwd"),
    (30, "Sam Butler", 20, "Forward"),
    (31, "Connor MacDonald", 40, "Mid/Fwd"),
    (32, "Finn Maginness", 35, "Midfielder"),
    (33, "Jack O'Sullivan", 0, "Forward"),
    (34, "Ethan Phillips", 0, "Def"),
    (35, "Calsher Dear", 0, "Key Fwd"),
    (36, "James Blanck", 30, "Key Def"),
    (37, "Josh Bennetts", 0, "Forward"),
    (38, "Max Ramsden", 5, "Ruck/Fwd"),
    (39, "Bailey Macdonald", 2, "Defender"),
    (40, "Seamus Mitchell", 15, "Def/Fwd"),
    (41, "Josh Tucker", 0, "Forward"),
    (42, "Clay Tucker", 0, "Ruck"),
    (43, "Jack Gunston", 250, "Forward"),
    (44, "Henry Hustwaite", 5, "Midfielder"),
]

# Update seed_idp.py
filepath = r'c:\\Users\\BillCarlin\\OneDrive - INTELIA PTY LTD\\Documents\\Hawthorn\\backend\\seeds\\seed_idp.py'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

players_str = "PLAYERS = [\n"
for p in hawthorn_players:
    players_str += f'    {p},\n'
players_str += "]"

# Replace PLAYERS array
new_content = re.sub(r'PLAYERS = \[.*?\]\n', players_str + '\n', content, flags=re.DOTALL)

# Replace the specific player overrides block with Hawthorn logic
hfc_logic = '''        # Known overrides for key players
        if jumper_no == 6:  # James Sicily (Captain)
            leadership = 10
            grit = max(grit, 9)
        elif jumper_no == 22:  # Luke Breust (Vice-Captain)
            leadership = 10
            execution = max(execution, 9)
        elif jumper_no == 3:  # Jai Newcombe
            grit = 10
            execution = max(execution, 9)
        elif jumper_no == 12:  # Will Day
            tactical_iq = 10
            execution = max(execution, 9)
        elif jumper_no == 13:  # Dylan Moore
            grit = 10
            leadership = max(leadership, 9)
        elif jumper_no == 43:  # Jack Gunston
            tactical_iq = max(tactical_iq, 9)
            execution = max(execution, 9)'''

new_content = re.sub(r'        # Known overrides for key players.*?        # Composite', hfc_logic + '\n\n        # Composite', new_content, flags=re.DOTALL)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(new_content)

print('Updated seed_idp.py')

# Update update_player_photos_phase11.py
filepath = r'c:\\Users\\BillCarlin\\OneDrive - INTELIA PTY LTD\\Documents\\Hawthorn\\backend\\seeds\\update_player_photos_phase11.py'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace photo_url color
content = content.replace('background=013B82', 'background=4D2004')
content = content.replace('HFC colors (#013B82 Blue, #FFFFFF White)', 'Hawthorn colors (#4D2004 Brown, #F6B000 Gold)')
content = content.replace('color=FFFFFF', 'color=F6B000')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated update_player_photos_phase11.py')

