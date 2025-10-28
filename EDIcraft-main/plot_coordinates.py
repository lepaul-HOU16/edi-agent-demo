#!/usr/bin/env python3
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
import numpy as np
from tools.coordinates import transform_surface_to_minecraft

def plot_coordinates(real_coords):
    """Plot real world and minecraft coordinates side by side."""
    
    # Calculate minecraft coordinates
    mc_coords = transform_surface_to_minecraft(real_coords)
    
    # Create figure with two subplots
    fig = plt.figure(figsize=(15, 6))
    
    # Real world coordinates plot
    ax1 = fig.add_subplot(121, projection='3d')
    real_x = [coord[0] for coord in real_coords]
    real_y = [coord[1] for coord in real_coords]
    real_z = [coord[2] for coord in real_coords]
    
    ax1.scatter(real_x, real_y, real_z, c='red', s=100, alpha=0.8)
    ax1.plot(real_x + [real_x[0]], real_y + [real_y[0]], real_z + [real_z[0]], 'r-', alpha=0.6)
    
    for i, (x, y, z) in enumerate(real_coords):
        ax1.text(x, y, z, f'  P{i+1}', fontsize=8)
    
    ax1.set_xlabel('X (Easting)')
    ax1.set_ylabel('Y (Northing)')
    ax1.set_zlabel('Z (Elevation)')
    ax1.set_title('Real World Coordinates')
    
    # Minecraft coordinates plot
    ax2 = fig.add_subplot(122, projection='3d')
    mc_x = [coord[0] for coord in mc_coords]
    mc_y = [coord[1] for coord in mc_coords]
    mc_z = [coord[2] for coord in mc_coords]
    
    ax2.scatter(mc_x, mc_y, mc_z, c='blue', s=100, alpha=0.8)
    ax2.plot(mc_x + [mc_x[0]], mc_y + [mc_y[0]], mc_z + [mc_z[0]], 'b-', alpha=0.6)
    
    for i, (x, y, z) in enumerate(mc_coords):
        ax2.text(x, y, z, f'  P{i+1}', fontsize=8)
    
    ax2.set_xlabel('X (Minecraft)')
    ax2.set_ylabel('Z (Minecraft)')
    ax2.set_zlabel('Y (Minecraft Height)')
    ax2.set_title('Minecraft Coordinates')
    
    plt.tight_layout()
    plt.show()
    
    # Print coordinate table
    print("\nCoordinate Transformation:")
    print("Real World (x, y, z) → Minecraft (x, y, z)")
    print("-" * 50)
    for i, (real, mc) in enumerate(zip(real_coords, mc_coords)):
        print(f"Point {i+1}: {real} → {mc}")

if __name__ == "__main__":
    # Test coordinates
    test_coords = [
        (35000, 200, -3000),
        (35000, 600, -3000),
        (33000, 200, -3500),
        (33000, 600, -3500)
    ]
    
    plot_coordinates(test_coords)
