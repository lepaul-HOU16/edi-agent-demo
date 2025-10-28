import os

class EDIcraftConfig:
    def __init__(self):
        self.minecraft_host = os.getenv('MINECRAFT_HOST', 'localhost')
        self.minecraft_rcon_port = int(os.getenv('MINECRAFT_RCON_PORT', '25575'))
        self.minecraft_rcon_password = os.getenv('MINECRAFT_RCON_PASSWORD', '')
        self.base_url = os.getenv('EDI_PLATFORM_URL', '')
        self.username = os.getenv('EDI_USERNAME', '')
        self.password = os.getenv('EDI_PASSWORD', '')
        self.client_id = os.getenv('EDI_CLIENT_ID', '')
        self.client_secret = os.getenv('EDI_CLIENT_SECRET', '')
        self.partition = os.getenv('EDI_PARTITION', 'osdu')
        self.max_file_size_kb = 1024
        self.max_coordinate_points = 10000
