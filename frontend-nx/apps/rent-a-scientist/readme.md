Just some notes regarding rent-a-scientist:

- Need to have role admin-ras for a user to be considered an admin in ras
- dayElems in admin.tsx needs to be fixed
- need to run hasura console in ./backend to access the console
- need to update the program that is then referenced by the one entry in the table RentAScientistConfig
- it will use the entry in RentAScientistConfig with id = 1
- if test_operation is set in the ras config table all outgoing emails will be redirected to ras@nanodesu.info, a mail I use for testing this stuff
- mailFrom can be noreply@edu.opencampus.sh
- the visibility of the program linked to the ras config determines if people can register, if it is set to false they cannot and the admin page says something about the finalized matching and mails getting send
- how to deal with psd files: `for f in *.psd; do convert -flatten "$f" "${f%.*}.jpg"; done`
- use mogrify to scale the images to a reasonable size: `mogrify -resize 400x400 *.jpg`
- use detox to fix any special characters in the scientist pictures
- make sure all scientist picture names are lowercase: `rename 'y/A-Z/a-z/' *`
- see `frontend-nx/apps/rent-a-scientist/fixnames.txt` for how to fix image names inside the csv files provided by KielRegion
