"""
Unit tests for CommandRouter
"""

import unittest
from command_router import CommandRouter


class TestCommandRouter(unittest.TestCase):
    """Test cases for CommandRouter class"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.router = CommandRouter()
    
    def test_is_command_getdata(self):
        """Test detection of /getdata command"""
        self.assertTrue(self.router.is_command('/getdata'))
        self.assertTrue(self.router.is_command('/GETDATA'))
        self.assertTrue(self.router.is_command('  /getdata  '))
    
    def test_is_command_reset(self):
        """Test detection of /reset command"""
        self.assertTrue(self.router.is_command('/reset'))
        self.assertTrue(self.router.is_command('/RESET'))
        self.assertTrue(self.router.is_command('  /reset  '))
    
    def test_is_command_not_command(self):
        """Test that non-commands return False"""
        self.assertFalse(self.router.is_command('show wells'))
        self.assertFalse(self.router.is_command('find wells deeper than 3000m'))
        self.assertFalse(self.router.is_command(''))
        self.assertFalse(self.router.is_command(None))
    
    def test_is_command_with_extra_text(self):
        """Test that commands with extra text are not recognized"""
        self.assertFalse(self.router.is_command('/getdata now'))
        self.assertFalse(self.router.is_command('/reset all'))
        self.assertFalse(self.router.is_command('please /getdata'))
    
    def test_get_command_type_getdata(self):
        """Test getting command type for /getdata"""
        self.assertEqual(self.router.get_command_type('/getdata'), 'getdata')
        self.assertEqual(self.router.get_command_type('/GETDATA'), 'getdata')
        self.assertEqual(self.router.get_command_type('  /getdata  '), 'getdata')
    
    def test_get_command_type_reset(self):
        """Test getting command type for /reset"""
        self.assertEqual(self.router.get_command_type('/reset'), 'reset')
        self.assertEqual(self.router.get_command_type('/RESET'), 'reset')
        self.assertEqual(self.router.get_command_type('  /reset  '), 'reset')
    
    def test_get_command_type_not_command(self):
        """Test that non-commands return None"""
        self.assertIsNone(self.router.get_command_type('show wells'))
        self.assertIsNone(self.router.get_command_type(''))
        self.assertIsNone(self.router.get_command_type(None))
    
    def test_get_command_type_with_extra_text(self):
        """Test that commands with extra text return None"""
        self.assertIsNone(self.router.get_command_type('/getdata now'))
        self.assertIsNone(self.router.get_command_type('/reset all'))
    
    def test_validate_command_valid_getdata(self):
        """Test validation of valid /getdata command"""
        result = self.router.validate_command('/getdata')
        self.assertTrue(result['valid'])
        self.assertEqual(result['command_type'], 'getdata')
        self.assertIsNone(result['error'])
    
    def test_validate_command_valid_reset(self):
        """Test validation of valid /reset command"""
        result = self.router.validate_command('/reset')
        self.assertTrue(result['valid'])
        self.assertEqual(result['command_type'], 'reset')
        self.assertIsNone(result['error'])
    
    def test_validate_command_invalid_syntax(self):
        """Test validation of commands with invalid syntax"""
        result = self.router.validate_command('/getdata extra text')
        self.assertFalse(result['valid'])
        self.assertIsNone(result['command_type'])
        self.assertIn('Invalid command syntax', result['error'])
        
        result = self.router.validate_command('/reset all')
        self.assertFalse(result['valid'])
        self.assertIsNone(result['command_type'])
        self.assertIn('Invalid command syntax', result['error'])
    
    def test_validate_command_unknown_command(self):
        """Test validation of unknown commands"""
        result = self.router.validate_command('/unknown')
        self.assertFalse(result['valid'])
        self.assertIsNone(result['command_type'])
        self.assertIn('Unknown command', result['error'])
        
        result = self.router.validate_command('/delete')
        self.assertFalse(result['valid'])
        self.assertIsNone(result['command_type'])
        self.assertIn('Unknown command', result['error'])
    
    def test_validate_command_not_command(self):
        """Test validation of non-command queries"""
        result = self.router.validate_command('show wells')
        self.assertFalse(result['valid'])
        self.assertIsNone(result['command_type'])
        self.assertIsNone(result['error'])  # No error for non-commands
    
    def test_validate_command_empty(self):
        """Test validation of empty prompt"""
        result = self.router.validate_command('')
        self.assertFalse(result['valid'])
        self.assertIsNone(result['command_type'])
        self.assertEqual(result['error'], 'Empty prompt provided')
        
        result = self.router.validate_command(None)
        self.assertFalse(result['valid'])
        self.assertIsNone(result['command_type'])
        self.assertEqual(result['error'], 'Empty prompt provided')
    
    def test_validate_command_case_insensitive(self):
        """Test that validation is case-insensitive"""
        result = self.router.validate_command('/GETDATA')
        self.assertTrue(result['valid'])
        self.assertEqual(result['command_type'], 'getdata')
        
        result = self.router.validate_command('/Reset')
        self.assertTrue(result['valid'])
        self.assertEqual(result['command_type'], 'reset')
    
    def test_validate_command_whitespace_handling(self):
        """Test that validation handles extra whitespace"""
        result = self.router.validate_command('  /getdata  ')
        self.assertTrue(result['valid'])
        self.assertEqual(result['command_type'], 'getdata')
        
        result = self.router.validate_command('  /reset  ')
        self.assertTrue(result['valid'])
        self.assertEqual(result['command_type'], 'reset')


if __name__ == '__main__':
    unittest.main()
