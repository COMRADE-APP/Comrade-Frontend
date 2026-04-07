import os
import re

def replace_colors(directory):
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(('.jsx', '.js', '.tsx', '.ts')):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()

                # Replace violet with primary
                content = re.sub(r'violet-(\d{2,3})', r'primary-\1', content)
                # Replace purple with green (to maintain gradient variation if necessary, or just primary)
                # Let's use primary for everything to be consistent with the brand, except gradients might be flat
                # Let's replace purple with primary as well, but shift the weight by 100 to maintain gradients
                def shift_purple(match):
                    weight = int(match.group(1))
                    if weight <= 800:
                        return f'primary-{weight + 100}'
                    return f'primary-{weight}'
                
                content = re.sub(r'purple-(\d{2,3})', shift_purple, content)

                with open(path, 'w', encoding='utf-8') as f:
                    f.write(content)

if __name__ == '__main__':
    replace_colors('C:/Users/Imani/Documents/Comrade/Comrade-Frontend/src')
    print('Colors replaced successfully.')
