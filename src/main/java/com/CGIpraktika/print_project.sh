#!/bin/zsh
# This script writes each file in the current directory and its subdirectories,
# excluding the node_modules directory, to an output file (default: project_debug.txt)
# in the following format:
#
# //relative/path/to/file
# <file contents>
#
# The output is first written to a temporary file to avoid scanning it while the script runs.
#
# Usage:
#   ./print_frontend.sh            # Writes to project_debug.txt
#   ./print_frontend.sh output.txt # Writes to output.txt

# Use the first argument as output file or default to project_debug.txt.
output_file="${1:-project_debug.txt}"

# Create a temporary file (outside the project tree)
temp_file=$(mktemp /tmp/project_debug.XXXXXX)
echo "Writing output to temporary file: $temp_file"

# Exclude the output file by name and the node_modules directory
find . -type d -name "node_modules" -prune -o \
       -type f ! -name "$(basename "$output_file")" -print0 | while IFS= read -r -d '' file; do
    # Remove the leading "./" for a cleaner output.
    relative="${file#./}"
    {
      echo "//${relative}"
      cat "$file"
      echo  # Blank line for separation.
    } >> "$temp_file"
done

# Move the temporary file to the desired output file.
mv "$temp_file" "$output_file"
echo "Done! Output written to $output_file"