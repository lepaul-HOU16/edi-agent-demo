#!/usr/bin/env python3
"""
Complete migration of CatalogPage and ChatPage from Next.js+Amplify to Vite+REST
Preserves exact DOM structure, only changes API calls and imports
"""

import re

def migrate_catalog_page():
    """Migrate CatalogPage.tsx"""
    with open('/tmp/catalog-original.tsx', 'r') as f:
        content = f.read()
    
    # Remove 'use client'
    content = content.replace("'use client';\n\n", "")
    
    # Fix imports
    content = content.replace('from "../../../utils/amplifyUtils"', 'from "@/utils/chatUtils"')
    content = content.replace('from "../../../utils/types"', 'from "@/utils/types"')
    content = content.replace('from "./MapComponent"', 'from "./MapComponent"')  # Keep as is
    
    # Remove Amplify imports
    content = re.sub(r'import \{ generateClient \} from "aws-amplify/data";\n', '', content)
    content = re.sub(r'import \{ type Schema \} from "@/\.\.\/amplify/data/resource";\n', '', content)
    
    # Remove amplifyClient initialization
    content = re.sub(
        r'const amplifyClient = React\.useMemo\(\(\) => generateClient<Schema>\(\), \[\]\);',
        '// amplifyClient removed - using REST API',
        content
    )
    
    # Fix activeChatSession type
    content = re.sub(
        r'const \[activeChatSession, setActiveChatSession\] = useState<Schema\["ChatSession"\]\["createType"\]>\(\{ id: "default" \} as Schema\["ChatSession"\]\["createType"\]\);',
        'const [activeChatSession, setActiveChatSession] = useState<any>({ id: "default" });',
        content
    )
    
    # Comment out Amplify API calls (will need manual REST API implementation)
    # Collection management
    content = re.sub(
        r'const response = await amplifyClient\.mutations\.collectionManagement\(mutationParams\);',
        '// TODO: Replace with REST API call\n      // const response = await createCollection(mutationParams);',
        content
    )
    
    # OSDU search
    content = re.sub(
        r'const osduResponse = await amplifyClient\.queries\.osduSearch\(',
        '// TODO: Replace with REST API call\n          // const osduResponse = await osduSearch(',
        content
    )
    
    # Catalog search
    content = re.sub(
        r'const searchResponse = await amplifyClient\.queries\.catalogSearch\(',
        '// TODO: Replace with REST API call\n      // const searchResponse = await catalogSearch(',
        content
    )
    
    with open('src/pages/CatalogPage.tsx', 'w') as f:
        f.write(content)
    
    print("✅ CatalogPage.tsx migrated")

def migrate_chat_page():
    """Migrate ChatPage.tsx"""
    with open('/tmp/chat-original.tsx', 'r') as f:
        content = f.read()
    
    # Remove 'use client'
    content = content.replace("'use client';\n\n", "")
    
    # Fix imports - Next.js to React Router
    content = content.replace('from "next/navigation"', 'from "react-router-dom"')
    content = content.replace('useRouter', 'useNavigate')
    
    # Fix relative imports to absolute
    content = re.sub(r'from "\.\./\.\./\.\./utils/', 'from "@/utils/', content)
    content = re.sub(r'from "\.\./\.\./\.\./components/', 'from "@/components/', content)
    
    # Remove Amplify imports
    content = re.sub(r'import \{ generateClient \} from "aws-amplify/data";\n', '', content)
    content = re.sub(r'import \{ type Schema \} from "@/\.\.\/amplify/data/resource";\n', '', content)
    
    # Remove amplifyClient
    content = re.sub(
        r'const amplifyClient = React\.useMemo\(\(\) => generateClient<Schema>\(\), \[\]\);',
        '// amplifyClient removed - using REST API',
        content
    )
    
    # Fix router usage
    content = re.sub(
        r'const router = useNavigate\(\);',
        'const navigate = useNavigate();',
        content
    )
    content = re.sub(
        r'router\.push\(',
        'navigate(',
        content
    )
    
    with open('src/pages/ChatPage.tsx', 'w') as f:
        f.write(content)
    
    print("✅ ChatPage.tsx migrated")

if __name__ == '__main__':
    print("🔄 Starting complete migration...")
    migrate_catalog_page()
    migrate_chat_page()
    print("✅ Migration complete!")
    print("\n⚠️  Manual steps needed:")
    print("1. Implement REST API calls for commented TODO sections")
    print("2. Test map rendering")
    print("3. Test chat functionality")
