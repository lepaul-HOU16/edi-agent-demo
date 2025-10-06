"""
Quick LAS Curve Verification
Simple script to check what curves are actually in your S3 LAS files
"""

import boto3
import re

def quick_las_analysis(bucket_name):
    """Quick analysis of LAS files in S3 bucket"""
    
    s3 = boto3.client('s3')
    
    print(f"🔍 Checking LAS files in bucket: {bucket_name}")
    print("=" * 60)
    
    try:
        # List LAS files
        response = s3.list_objects_v2(Bucket=bucket_name)
        las_files = [obj['Key'] for obj in response.get('Contents', []) 
                    if obj['Key'].lower().endswith('.las')]
        
        print(f"Found {len(las_files)} LAS files")
        print()
        
        # Check first few files for curve content
        for i, las_file in enumerate(las_files[:5]):  # Check first 5 files
            print(f"📄 {las_file}")
            
            try:
                # Download and read file
                obj = s3.get_object(Bucket=bucket_name, Key=las_file)
                content = obj['Body'].read().decode('utf-8', errors='ignore')
                
                # Extract curves from ~CURVE section
                curves = extract_curves_from_las(content)
                
                print(f"   Curves found: {', '.join(curves)}")
                
                # Check for key curves
                key_curves = ['GR', 'RT', 'RHOB', 'NPHI', 'DEPT']
                missing = [c for c in key_curves if not any(c in curve.upper() for curve in curves)]
                
                if missing:
                    print(f"   Missing: {', '.join(missing)}")
                else:
                    print(f"   ✅ All key curves present")
                    
            except Exception as e:
                print(f"   ❌ Error reading file: {str(e)}")
            
            print()
            
        # Quick summary
        print("🎯 **QUICK ASSESSMENT**")
        print("Based on sample files:")
        
        if las_files:
            # Check one representative file
            try:
                obj = s3.get_object(Bucket=bucket_name, Key=las_files[0])
                content = obj['Body'].read().decode('utf-8', errors='ignore')
                curves = extract_curves_from_las(content)
                
                has_gr = any('GR' in c.upper() for c in curves)
                has_rt = any('RT' in c.upper() or 'RES' in c.upper() for c in curves)
                has_rhob = any('RHOB' in c.upper() or 'DEN' in c.upper() for c in curves)
                has_nphi = any('NPHI' in c.upper() or 'NEU' in c.upper() for c in curves)
                
                print(f"- Gamma Ray (GR): {'✅ Found' if has_gr else '❌ Missing'}")
                print(f"- True Resistivity (RT): {'✅ Found' if has_rt else '❌ Missing'}")  
                print(f"- Bulk Density (RHOB): {'✅ Found' if has_rhob else '❌ Missing'}")
                print(f"- Neutron Porosity (NPHI): {'✅ Found' if has_nphi else '❌ Missing'}")
                
            except:
                print("- Unable to determine curve availability")
        else:
            print("- No LAS files found in bucket")
            
    except Exception as e:
        print(f"❌ Error accessing S3 bucket: {str(e)}")
        print("\nPossible issues:")
        print("1. Bucket name incorrect")
        print("2. AWS credentials not configured")
        print("3. No permission to access bucket")

def extract_curves_from_las(content):
    """Extract curve names from LAS file content"""
    curves = []
    lines = content.split('\n')
    in_curve_section = False
    
    for line in lines:
        line = line.strip()
        
        if line.startswith('~C') or line.startswith('~CURVE'):
            in_curve_section = True
            continue
            
        if line.startswith('~') and not line.startswith('~C'):
            in_curve_section = False
            continue
            
        if in_curve_section and line and not line.startswith('#'):
            # Extract curve name
            match = re.match(r'^([A-Za-z0-9_]+)', line)
            if match:
                curves.append(match.group(1))
    
    return curves

if __name__ == "__main__":
    # You need to update this with your actual bucket name
    BUCKET_NAME = "amplify-d1eeg2gu6ddc3z-ma-workshopstoragebucketd9b-lzf4vwokty7m"  # ← UPDATE THIS
    
    print("🚀 Quick LAS Curve Check")
    print("=" * 30)
    
    if BUCKET_NAME == "your-bucket-name-here":
        print("❌ Please update BUCKET_NAME in the script with your actual S3 bucket name")
    else:
        quick_las_analysis(BUCKET_NAME)