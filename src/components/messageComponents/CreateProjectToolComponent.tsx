import React from 'react';
import Link from 'next/link';
import { Theme } from '@mui/material/styles';
import { Card, CardContent, Typography, Box, Chip, Grid2 as Grid, CardActions, Button } from '@mui/material';
import { formatCurrency } from '../../utils/formatters';
import { Message } from '@/../utils/types';

interface ProjectFinancial {
  // NPV10: number;
  cost: number;
  revenuePresentValue: number;
  incrimentalOilRateBOPD: number | null;
  incrimentalGasRateMCFD: number | null;
  successProbability: number;
  __typename: string;
}

interface Project {
  createdAt: string;
  description: string;
  financial: ProjectFinancial;
  foundationModelId: string;
  id: string;
  name: string;
  owner: string | null;
  procedureS3Path: string;
  reportS3Path: string;
  result: string | null;
  sourceChatSessionId: string;
  status: string;
  updatedAt: string;
  __typename: string;
}

interface ProjectToolResponse {
  status: string;
  message: string;
  project: Project;
}

interface CreateProjectToolComponentProps {
  content: Message['content'];
  theme: Theme;
}

const CreateProjectToolComponent: React.FC<CreateProjectToolComponentProps> = ({ content, theme }) => {
  try {
    const toolData: ProjectToolResponse = JSON.parse((content as any)?.text || '{}');
    const { project } = toolData;

    const npvr = (project.financial.revenuePresentValue - project.financial.cost)/project.financial.cost;


    return (
      <Card sx={{
        backgroundColor: theme.palette.background.paper,
        borderRadius: theme.shape.borderRadius,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        maxWidth: '90%',
        margin: theme.spacing(1, 0),
        border: `1px solid ${theme.palette.success.main}`
      }}>
        <CardContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom sx={{
              color: theme.palette.primary.main,
              fontWeight: 'bold'
            }}>
              {project.name}
            </Typography>
            <Chip
              label={project.status.toUpperCase()}
              color="success"
              size="small"
              sx={{ mb: 1 }}
            />
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              {project.description}
            </Typography>
          </Box>

          <Grid container spacing={2}>
            <Grid>
              <Typography variant="subtitle2" color="text.secondary">
                Financial Summary
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    color: npvr >= 0 ? theme.palette.success.main : theme.palette.error.main
                  }}
                >
                  Net Present Value Ratio: {npvr.toFixed(1)}
                </Typography>
                <Typography variant="body2">
                  Revenue PV10: {formatCurrency(project.financial.revenuePresentValue)}
                </Typography>
                <Typography variant="body2">
                  Cost: {formatCurrency(project.financial.cost)}
                </Typography>
                <Typography variant="body2">
                  Success Probability: {(project.financial.successProbability * 100).toFixed(1)}%
                </Typography>
              </Box>
            </Grid>
            <Grid>
              <Typography variant="subtitle2" color="text.secondary">
                Project Details
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2">
                  Created: {new Date(project.createdAt).toLocaleDateString()}
                </Typography>
                <Typography variant="body2">
                  ID: {project.id}
                </Typography>
                <Typography variant="body2">
                  Model: {project.foundationModelId.split(':')[0]}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
        <CardActions>
          <Link
            href={`/preview/chatSessionArtifacts/sessionId=${project.sourceChatSessionId}/${project.reportS3Path}`}
            target='_blank'
            rel='noopener noreferrer'
            passHref
          >
            <Button>Open Report</Button>
          </Link>
        </CardActions>
      </Card>
    );
  } catch (error) {
    return (
      <Box sx={{
        backgroundColor: theme.palette.grey[200],
        padding: theme.spacing(1),
        borderRadius: theme.shape.borderRadius,
      }}>
        <Typography variant="subtitle2" color="error" gutterBottom>
          Error parsing project generation data
        </Typography>
        <div>
          {(content as any)?.text}
        </div>
      </Box>
    );
  }
};

export default CreateProjectToolComponent;
