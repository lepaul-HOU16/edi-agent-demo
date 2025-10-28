#!/usr/bin/env python3
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
import numpy as np
from tools.coordinates import transform_surface_to_minecraft, transform_trajectory_to_minecraft

def plot_combined(horizon_coords, trajectory_coords):
    """Plot horizon and trajectory in real world and combined in minecraft."""
    
    # Calculate minecraft coordinates
    mc_horizon = transform_surface_to_minecraft(horizon_coords)
    mc_trajectory = transform_trajectory_to_minecraft(trajectory_coords)
    
    # Create figure with three subplots
    fig = plt.figure(figsize=(20, 6))
    
    # 1. Horizon real world coordinates
    ax1 = fig.add_subplot(131, projection='3d')
    h_x = [coord[0] for coord in horizon_coords]
    h_y = [coord[1] for coord in horizon_coords]
    h_z = [coord[2] for coord in horizon_coords]
    
    ax1.scatter(h_x, h_y, h_z, c='green', s=60, alpha=0.8, label='Horizon')
    ax1.plot(h_x + [h_x[0]], h_y + [h_y[0]], h_z + [h_z[0]], 'g-', alpha=0.6)
    
    ax1.set_xlabel('X (Easting)')
    ax1.set_ylabel('Y (Northing)')
    ax1.set_zlabel('Z (Elevation)')
    ax1.set_title('Horizon - Real World')
    ax1.legend()
    
    # 2. Trajectory real world coordinates
    ax2 = fig.add_subplot(132, projection='3d')
    t_x = [coord[0] for coord in trajectory_coords]
    t_y = [coord[1] for coord in trajectory_coords]
    t_z = [coord[2] for coord in trajectory_coords]
    
    ax2.scatter(t_x, t_y, t_z, c='red', s=60, alpha=0.8, label='Wellbore')
    ax2.plot(t_x, t_y, t_z, 'r-', alpha=0.6)
    
    ax2.set_xlabel('X (Easting)')
    ax2.set_ylabel('Y (Northing)')
    ax2.set_zlabel('Z (Elevation)')
    ax2.set_title('Wellbore - Real World')
    ax2.legend()
    
    # 3. Combined minecraft coordinates
    ax3 = fig.add_subplot(133, projection='3d')
    
    # Plot horizon - map MC coordinates correctly: MC(x,y,z) -> plot(x,z,y)
    mc_h_x = [coord[0] for coord in mc_horizon]  # MC X -> plot X
    mc_h_y = [coord[2] for coord in mc_horizon]  # MC Z -> plot Y  
    mc_h_z = [coord[1] for coord in mc_horizon]  # MC Y -> plot Z (vertical)
    
    ax3.scatter(mc_h_x, mc_h_y, mc_h_z, c='green', s=60, alpha=0.8, label='Horizon')
    ax3.plot(mc_h_x + [mc_h_x[0]], mc_h_y + [mc_h_y[0]], mc_h_z + [mc_h_z[0]], 'g-', alpha=0.6)
    
    # Plot trajectory - map MC coordinates correctly: MC(x,y,z) -> plot(x,z,y)
    mc_t_x = [coord[0] for coord in mc_trajectory]  # MC X -> plot X
    mc_t_y = [coord[2] for coord in mc_trajectory]  # MC Z -> plot Y
    mc_t_z = [coord[1] for coord in mc_trajectory]  # MC Y -> plot Z (vertical)
    
    ax3.scatter(mc_t_x, mc_t_y, mc_t_z, c='red', s=60, alpha=0.8, label='Wellbore')
    ax3.plot(mc_t_x, mc_t_y, mc_t_z, 'r-', alpha=0.6)
    
    ax3.set_xlabel('X (Minecraft)')
    ax3.set_ylabel('Z (Minecraft)')
    ax3.set_zlabel('Y (Minecraft Height)')
    ax3.set_title('Combined - Minecraft')
    ax3.legend()
    
    # Set minecraft plot limits
    ax3.set_xlim(0, 100)
    ax3.set_ylim(0, 100)
    ax3.set_zlim(30, 100)
    
    plt.tight_layout()
    plt.show()
    
    # Print summary - use the correct Y coordinates (vertical axis)
    horizon_y_coords = [coord[1] for coord in mc_horizon]  # MC Y coordinates
    trajectory_y_coords = [coord[1] for coord in mc_trajectory]  # MC Y coordinates
    
    print(f"\nHorizon: {len(mc_horizon)} points (Y: {min(horizon_y_coords)}-{max(horizon_y_coords)})")
    print(f"Wellbore: {len(mc_trajectory)} points (Y: {min(trajectory_y_coords)}-{max(trajectory_y_coords)})")

# Example 1: Simple rectangular horizon with vertical wellbore
def example1():
    print("=== Example 1: Rectangular Horizon + Vertical Wellbore ===")
    horizon = [(35000, 200, -3000), (35000, 600, -3000), (33000, 600, -3500), (33000, 200, -3500)]
    trajectory = [(34000, 400, -2500), (34000, 400, -3000), (34000, 400, -3500), (34000, 400, -4000)]
    plot_combined(horizon, trajectory)

# Example 2: Triangular horizon with deviated wellbore
def example2():
    print("=== Example 2: Triangular Horizon + Deviated Wellbore ===")
    horizon = [(50000, 100, -2000), (52000, 300, -2200), (51000, 500, -2100)]
    trajectory = [(51000, 200, -1800), (51100, 250, -2500), (51300, 350, -3200), (51600, 450, -3800)]
    plot_combined(horizon, trajectory)

# Example 3: Complex horizon with horizontal wellbore
def example3():
    print("=== Example 3: Complex Horizon + Horizontal Wellbore ===")
    horizon = [(40000, 0, -1500), (42000, 0, -1600), (42000, 400, -1700), (41000, 600, -1550), (40000, 400, -1450)]
    trajectory = [(40500, 200, -1400), (40800, 250, -1450), (41200, 300, -1500), (41800, 350, -1520)]
    plot_combined(horizon, trajectory)

if __name__ == "__main__":
    example1()
    example2() 
    example3()
