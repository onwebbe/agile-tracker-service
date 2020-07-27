mongoexport --db agiletracker -c groups -o groups_agiletrackerInitialDump.json
mongoexport --db agiletracker -c modules -o modules_agiletrackerInitialDump.json
mongoexport --db agiletracker -c sessions -o sessions_agiletrackerInitialDump.json
mongoexport --db agiletracker -c sprintdays -o sprintdays_agiletrackerInitialDump.json
mongoexport --db agiletracker -c sprintlists -o sprintlists_agiletrackerInitialDump.json
mongoexport --db agiletracker -c storyissues -o storyissues_agiletrackerInitialDump.json
mongoexport --db agiletracker -c usermaps -o usermaps_agiletrackerInitialDump.json
mongoexport --db agiletracker -c users -o users_agiletrackerInitialDump.json
mongoexport --db agiletracker -c userstoryaudits -o userstoryaudits_agiletrackerInitialDump.json
mongoexport --db agiletracker -c userstorys -o userstorys_agiletrackerInitialDump.json
mongoexport --db agiletracker -c worklogs -o worklogs_agiletrackerInitialDump.json


mongoimport --port 37117 --db agiletracker -c groups --file groups_agiletrackerInitialDump.json
mongoimport --port 37117 --db agiletracker -c modules --file modules_agiletrackerInitialDump.json
mongoimport --port 37117 --db agiletracker -c sessions --file sessions_agiletrackerInitialDump.json
mongoimport --port 37117 --db agiletracker -c sprintdays --file sprintdays_agiletrackerInitialDump.json
mongoimport --port 37117 --db agiletracker -c sprintlists --file sprintlists_agiletrackerInitialDump.json
mongoimport --port 37117 --db agiletracker -c storyissues --file storyissues_agiletrackerInitialDump.json
mongoimport --port 37117 --db agiletracker -c usermaps --file usermaps_agiletrackerInitialDump.json
mongoimport --port 37117 --db agiletracker -c users --file users_agiletrackerInitialDump.json
mongoimport --port 37117 --db agiletracker -c userstoryaudits --file userstoryaudits_agiletrackerInitialDump.json
mongoimport --port 37117 --db agiletracker -c userstorys --file userstorys_agiletrackerInitialDump.json
mongoimport --port 37117 --db agiletracker -c worklogs --file worklogs_agiletrackerInitialDump.json
