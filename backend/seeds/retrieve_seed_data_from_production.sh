#!/bin/bash

# Set environment variables for production database access
# (Assuming these are already set or provided)
# PROD_DB_HOST
# PROD_DB_PORT
# PROD_DB_NAME
# PROD_DB_USER
# PROD_DB_PASSWORD

# Output file
OUTPUT_FILE="dev_seeds.sql"

# Function to sanitize data
sanitize_data() {
    sed 's/\\/\\\\/g; s/"/\\"/g; s/'"'"'/\\'"'"'/g'
}

# Clear the output file
> $OUTPUT_FILE

# Array of tables to export
tables=("User" "Course" "Program" "Session" "CourseEnrollment" "Expert" "Admin" "CourseGroup" "CourseLocation" "CourseInstructor" "SessionAddress" "SessionSpeaker" "AchievementOption" "AchievementRecord" "AchievementRecordAuthor")

# Loop through tables and export data
for table in "${tables[@]}"
do
    echo "Exporting data from $table..."
    
    # Get a sample of 10 rows from the table
    psql -h $PROD_DB_HOST -p $PROD_DB_PORT -d $PROD_DB_NAME -U $PROD_DB_USER -t -A -F"," -c "SELECT * FROM \"$table\" LIMIT 10" | while IFS=',' read -r -a row
    do
        columns=""
        values=""
        for i in "${!row[@]}"
        do
            columns+="\"${row[$i]}\","
            values+="'$(echo "${row[$i]}" | sanitize_data)',"
        done
        columns=${columns%,}
        values=${values%,}
        
        echo "INSERT INTO \"$table\" ($columns) VALUES ($values);" >> $OUTPUT_FILE
    done
    
    echo "" >> $OUTPUT_FILE
done

# Add sequence reset statements
echo "-- Reset sequences" >> $OUTPUT_FILE
for table in "${tables[@]}"
do
    echo "SELECT setval('\"${table}_Id_seq\"'::regclass, (SELECT MAX(\"Id\") FROM \"$table\"));" >> $OUTPUT_FILE
done

echo "Dev seeds file generated: $OUTPUT_FILE"
