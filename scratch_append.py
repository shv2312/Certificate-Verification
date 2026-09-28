import sys
log_file = sys.argv[1]
text_to_append = sys.argv[2]

with open(log_file, 'r', encoding='utf-8') as f:
    text = f.read()

with open(log_file, 'w', encoding='utf-8') as f:
    f.write(text + "\n\n" + text_to_append)
