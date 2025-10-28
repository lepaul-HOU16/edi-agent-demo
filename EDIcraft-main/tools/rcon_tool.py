import os
from rcon import Client

def execute_rcon_command(command: str) -> str:
    """Execute a command on the Minecraft server via RCON."""
    host = os.getenv('MINECRAFT_HOST', 'localhost')
    port = int(os.getenv('MINECRAFT_RCON_PORT', '25575'))
    password = os.getenv('MINECRAFT_RCON_PASSWORD', '')
    
    try:
        with Client(host, port, passwd=password) as client:
            response = client.run(command)
            return f"Command executed: {command}\nResponse: {response}"
    except Exception as e:
        return f"RCON Error: {str(e)}"
