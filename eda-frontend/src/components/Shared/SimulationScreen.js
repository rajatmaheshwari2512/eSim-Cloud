import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import {
  Slide,
  Button,
  Dialog,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Grid,
  TextField,
  Paper,
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import CloseIcon from '@material-ui/icons/Close'
import { useSelector } from 'react-redux'

import Graph from './Graph'

var FileSaver = require('file-saver')

const Transition = React.forwardRef(function Transition (props, ref) {
  return <Slide direction="up" ref={ref} {...props} />
})

const useStyles = makeStyles((theme) => ({
  appBar: {
    position: 'relative'
  },
  title: {
    marginLeft: theme.spacing(2),
    flex: 1
  },
  header: {
    padding: theme.spacing(5, 0, 6),
    color: '#fff'
  },
  paper: {
    padding: theme.spacing(2),
    textAlign: 'center',
    backgroundColor: '#404040',
    color: '#fff'
  }
}))
// {details:{},title:''} simResults
export default function SimulationScreen ({ open, close, isResult, taskId }) {
  const classes = useStyles()
  const result = useSelector((state) => state.simulationReducer)
  const stitle = useSelector((state) => state.netlistReducer.title)
  const [xscale, setXScale] = React.useState('si')
  const [yscale, setYScale] = React.useState('si')
  const [scalesNonGraphArray, setScalesNonGraph] = useState([])
  const [exactDecimal, setExactDecimal] = useState([])
  const [notation, setNotation] = React.useState('Engineering')
  const [precision, setPrecision] = React.useState(5)
  const precisionArr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  const scalesNonGraph = []
  const exactDecimalArray = []
  const scales = {
    G: 1000000000,
    M: 1000000,
    K: 1000,
    si: 1,
    m: 0.001,
    u: 0.000001,
    n: 0.000000001,
    p: 0.000000000001
  }
  const toFixed = (x) => {
    var e = 0
    if (Math.abs(x) < 1.0) {
      e = parseInt(x.toString().split('e-')[1])
      if (e) {
        x *= Math.pow(10, e - 1)
        x = '0.' + (new Array(e)).join('0') + x.toString().substring(2)
      }
    } else {
      e = parseInt(x.toString().split('+')[1])
      if (e > 20) {
        e -= 20
        x /= Math.pow(10, e)
        x += (new Array(e + 1)).join('0')
      }
    }
    return x
  }
  const decimalCount = (num1, num2) => {
    var difference = toFixed(num1) - toFixed(num2)
    const numStr = toFixed(difference).toString()
    if (Math.abs(difference) < 1) {
      if (numStr.includes('.')) {
        return ['decimal', numStr.split('.')[1].length]
      }
    } else {
      return ['notDecimal', numStr.split('.')[0].length]
    }
    return ['notDecimal', 1]
  }
  const decimalCountNonGraph = (num) => {
    const numStr = num.toString()
    if (Math.abs(num) < 1) {
      if (numStr.includes('.')) {
        var afterDeci = numStr.split('.')[1]
        var count = 0
        while (afterDeci[count] === '0') {
          count++
        }
        return ['decimal', count + 2] // count + 2 to adjust with the scaling feature. 0.000xyz will become xyz.abc mUnit
      }
    } else {
      return ['notDecimal', numStr.split('.')[0].length]
    }
    return ['notDecimal', 1]
  }
  const exactDecimalCount = (num) => {
    const numStr = num.toString()
    if (Math.abs(num) < 1) {
      if (numStr.includes('.')) {
        var afterDeci = numStr.split('.')[1]
        var count = 0
        while (afterDeci[count] === '0') {
          count++
        }
        return ['decimal', -1 * (count + 1)] // count + 2 to adjust with the scaling feature. 0.000xyz will become xyz.abc mUnit
      }
    } else {
      var beforeDeci = numStr.split('.')[0]
      return ['notDecimal', (beforeDeci.length - 1)]
    }
    return ['notDecimal', 0]
  }
  useEffect(() => {
    if (isResult === true) {
      var g, val, idx
      if (result.graph !== {} && result.isGraph !== 'false') {
        g = 1
        setScales(g, val, idx)
      } else {
        g = 0
        addScalesNonGraph(g)
      }
    }
    // eslint-disable-next-line
  }, [isResult])

  const addScalesNonGraph = (g) => {
    result.text.forEach((line, index) => {
      setScales(g, parseFloat(line.split(' ')[2]), index)
      var count = exactDecimalCount(parseFloat(line.split(' ')[2]))
      if (exactDecimalArray.length <= index) {
        exactDecimalArray.push(count[1])
      } else {
        exactDecimalArray[index] = count
      }
    })
    setExactDecimal(exactDecimalArray)
  }

  const setScales = (g, val, idx) => {
    var countX, countY
    if (g === 1) {
      countX = decimalCount(Math.min(...result.graph.x_points), Math.max(...result.graph.x_points))
      countY = decimalCount(Math.min(...result.graph.y_points[0]), Math.max(...result.graph.y_points[0]))
    } else {
      countX = decimalCountNonGraph(val)
      countY = countX // not required. used only countX for nongraphical output
    }
    if (countX[0] === 'decimal') {
      if (countX[1] > 0 && countX[1] <= 4) {
        if (g === 1) {
          setXScale('m')
        } else {
          if (scalesNonGraph.length <= idx || scalesNonGraph.length === 0) {
            scalesNonGraph.push('m')
            setScalesNonGraph(scalesNonGraph)
          } else {
            scalesNonGraph[idx] = 'm'
            setScalesNonGraph(scalesNonGraph)
          }
        }
      } else if (countX[1] > 4 && countX[1] <= 7) {
        if (g === 1) {
          setXScale('u')
        } else {
          if (scalesNonGraph.length <= idx || scalesNonGraph.length === 0) {
            scalesNonGraph.push('u')
            setScalesNonGraph(scalesNonGraph)
          } else {
            scalesNonGraph[idx] = 'u'
            setScalesNonGraph(scalesNonGraph)
          }
        }
      } else if (countX[1] > 7 && countX[1] <= 10) {
        if (g === 1) {
          setXScale('n')
        } else {
          if (scalesNonGraph.length <= idx || scalesNonGraph.length === 0) {
            scalesNonGraph.push('n')
            setScalesNonGraph(scalesNonGraph)
          } else {
            scalesNonGraph[idx] = 'n'
            setScalesNonGraph(scalesNonGraph)
          }
        }
      } else if (countX[1] > 10 && countX[1] <= 12) {
        if (g === 1) {
          setXScale('p')
        } else {
          if (scalesNonGraph.length <= idx || scalesNonGraph.length === 0) {
            scalesNonGraph.push('p')
            setScalesNonGraph(scalesNonGraph)
          } else {
            scalesNonGraph[idx] = 'p'
            setScalesNonGraph(scalesNonGraph)
          }
        }
      }
    } else {
      if (countX[1] > 0 && countX[1] <= 4) {
        if (g === 1) {
          setXScale('si')
        } else {
          if (scalesNonGraph.length <= idx || scalesNonGraph.length === 0) {
            scalesNonGraph.push('si')
            setScalesNonGraph(scalesNonGraph)
          } else {
            scalesNonGraph[idx] = 'si'
            setScalesNonGraph(scalesNonGraph)
          }
        }
      } else if (countX[1] > 4 && countX[1] <= 7) {
        if (g === 1) {
          setXScale('K')
        } else {
          if (scalesNonGraph.length <= idx || scalesNonGraph.length === 0) {
            scalesNonGraph.push('K')
            setScalesNonGraph(scalesNonGraph)
          } else {
            scalesNonGraph[idx] = 'K'
            setScalesNonGraph(scalesNonGraph)
          }
        }
      } else if (countX[1] > 7 && countX[1] <= 10) {
        if (g === 1) {
          setXScale('M')
        } else {
          if (scalesNonGraph.length <= idx || scalesNonGraph.length === 0) {
            scalesNonGraph.push('M')
            setScalesNonGraph(scalesNonGraph)
          } else {
            scalesNonGraph[idx] = 'M'
            setScalesNonGraph(scalesNonGraph)
          }
        }
      } else if (countX[1] > 10) {
        if (g === 1) {
          setXScale('G')
        } else {
          if (scalesNonGraph.length <= idx || scalesNonGraph.length === 0) {
            scalesNonGraph.push('G')
            setScalesNonGraph(scalesNonGraph)
          } else {
            scalesNonGraph[idx] = 'G'
            setScalesNonGraph(scalesNonGraph)
          }
        }
      }
    }
    if (countY[0] === 'decimal') {
      if (countY[1] > 0 && countY[1] <= 4) {
        setYScale('m')
      } else if (countY[1] > 4 && countY[1] <= 7) {
        setYScale('u')
      } else if (countY[1] > 7 && countY[1] <= 10) {
        setYScale('n')
      } else if (countY[1] > 10 && countY[1] <= 12) {
        setYScale('p')
      }
    } else {
      if (countY[1] > 0 && countY[1] <= 4) {
        setYScale('si')
      } else if (countY[1] > 4 && countY[1] <= 7) {
        setYScale('K')
      } else if (countY[1] > 7 && countY[1] <= 10) {
        setYScale('M')
      } else if (countY[1] > 10) {
        setYScale('G')
      }
    }
  }
  const handleXScale = (evt) => {
    setXScale(evt.target.value)
  }

  const handleYScale = (evt) => {
    setYScale(evt.target.value)
  }
  const handlePrecision = (evt) => {
    setPrecision(evt.target.value)
  }
  const handleNotation = (evt) => {
    setNotation(evt.target.value)
  }
  const generateCSV = () => {
    var headings = ''
    result.graph.labels.forEach(label => {
      headings = headings + label + ','
    })

    headings = headings.slice(0, -1)
    headings += '\n'
    var downloadString = ''

    for (var x = 0; x < result.graph.x_points.length; x++) {
      downloadString += result.graph.x_points[x]
      for (var y = 0; y < result.graph.y_points.length; y++) {
        downloadString = downloadString + ',' + result.graph.y_points[y][x]
      }
      downloadString += '\n'
    }

    downloadString = headings.concat(downloadString)
    return downloadString
  }
  const handleCsvDownload = () => {
    var downloadString = generateCSV()
    var blob = new Blob([downloadString], { type: 'text/plain;charset=utf-8' })
    FileSaver.saveAs(blob, 'graph_points_eSim_on_cloud.csv')
  }

  return (
    <div>
      <Dialog fullScreen open={open} onClose={close} TransitionComponent={Transition} PaperProps={{
        style: {
          backgroundColor: '#4d4d4d',
          boxShadow: 'none'
        }
      }}>
        <AppBar position="static" elevation={0} className={classes.appBar}>
          <Toolbar variant="dense" style={{ backgroundColor: '#404040' }} >
            <IconButton edge="start" color="inherit" onClick={close} aria-label="close">
              <CloseIcon />
            </IconButton>
            <Typography variant="h6" className={classes.title}>
              Simulation Result
            </Typography>
            <Button autoFocus color="inherit" onClick={close}>
              close
            </Button>
          </Toolbar>
        </AppBar>
        <Container maxWidth="lg" className={classes.header}>
          <Grid
            container
            spacing={3}
            direction="row"
            justify="center"
            alignItems="center"
          >
            {/* Card to display simualtion result screen header */}
            <Grid item xs={12} sm={12}>
              <Paper className={classes.paper}>
                <Typography variant="h2" align="center" gutterBottom>
                  {result.title}
                </Typography>
                <Typography variant="h5" align="center" component="p" gutterBottom>
                  Simulation Result for {stitle} *
                </Typography>
              </Paper>
            </Grid>

            {/* Display graph result */}
            {isResult === true ? <>
              {

                (result.graph !== {} && result.isGraph === 'true')
                  ? <Grid item xs={12} sm={12}>
                    <Paper className={classes.paper}>
                      <Typography variant="h4" align="center" gutterBottom>
                        GRAPH OUTPUT
                      </Typography>
                      <div style={{ padding: '15px 10px 10px 10px', margin: '20px 0px', backgroundColor: 'white', borderRadius: '5px' }}>
                        <TextField
                          style={{ width: '20%' }}
                          id="xscale"
                          size='small'
                          variant="outlined"
                          select
                          label="Select X Axis Scale"
                          value={xscale}
                          onChange={handleXScale}
                          SelectProps={{
                            native: true
                          }}
                        >
                          <option value='G'>
                            Giga (G)
                          </option>
                          <option value='M'>
                            Mega (MEG)
                          </option>
                          <option value='K'>
                            Kilo (K)
                          </option>
                          <option value='si'>
                            SI UNIT
                          </option>

                          <option value='m'>
                            Milli (m)
                          </option>
                          <option value='u'>
                            Micro (u)
                          </option>
                          <option value='n'>
                            Nano (n)
                          </option>
                          <option value='p'>
                            Pico (p)
                          </option>

                        </TextField>
                        <TextField
                          style={{ width: '20%', marginLeft: '10px' }}
                          id="yscale"
                          size='small'
                          variant="outlined"
                          select
                          label="Select Y Axis Scale"
                          value={yscale}
                          onChange={handleYScale}
                          SelectProps={{
                            native: true
                          }}
                        >
                          <option value='G'>
                            Giga (G)
                          </option>
                          <option value='M'>
                            Mega (MEG)
                          </option>
                          <option value='K'>
                            Kilo (K)
                          </option>
                          <option value='si'>
                            SI UNIT
                          </option>

                          <option value='m'>
                            Milli (m)
                          </option>
                          <option value='u'>
                            Micro (u)
                          </option>
                          <option value='n'>
                            Nano (n)
                          </option>
                          <option value='p'>
                            Pico (p)
                          </option>

                        </TextField>

                        <TextField
                          style={{ width: '20%', marginLeft: '10px' }}
                          id="precision"
                          size='small'
                          variant="outlined"
                          select
                          label="Select Precision"
                          value={precision}
                          onChange={handlePrecision}
                          SelectProps={{
                            native: true
                          }}
                        >
                          {
                            precisionArr.map((d, i) => {
                              return (
                                <option key={i} value={d}>
                                  {d}
                                </option>
                              )
                            })
                          }

                        </TextField>
                        {result.isGraph === 'true' && <Button variant="contained" style={{ marginLeft: '1%' }} color="primary" size="medium" onClick={handleCsvDownload}>
                          Download Graph Output
                        </Button>}
                      </div>
                      <Graph
                        labels={result.graph.labels}
                        x={result.graph.x_points}
                        y={result.graph.y_points}
                        xscale={xscale}
                        yscale={yscale}
                        precision={precision}
                      />
                    </Paper>
                  </Grid>
                  : (result.isGraph === 'true') ? <span>SOMETHING WENT WRONG PLEASE CHECK THE SIMULATION PARAMETERS.</span> : <span></span>
              }

              {
                (result.isGraph === 'false')
                  ? <Grid item xs={12} sm={12}>
                    <Paper className={classes.paper}>
                      <Typography variant="h4" align="center" gutterBottom>
                        OUTPUT
                      </Typography>
                      <div style={{ padding: '15px 10px 10px 10px', backgroundColor: 'white', margin: '20px 0px', borderRadius: '5px' }}>
                        <TextField
                          style={{ width: '20%' }}
                          id="notation"
                          size='small'
                          variant="outlined"
                          select
                          label="Select Notation"
                          value={notation}
                          onChange={handleNotation}
                          SelectProps={{
                            native: true
                          }}
                        >
                          <option value='Engineering'>
                                Engineering Notation
                          </option>
                          <option value='Scientific'>
                                Scientific Notation
                          </option>
                        </TextField>

                        <TextField
                          style={{ width: '20%', marginLeft: '10px' }}
                          id="precision"
                          size='small'
                          variant="outlined"
                          select
                          label="Select Precision"
                          value={precision}
                          onChange={handlePrecision}
                          SelectProps={{
                            native: true
                          }}
                        >
                          {
                            precisionArr.map((d, i) => {
                              return (
                                <option key={i} value={d}>
                                  {d}
                                </option>
                              )
                            })
                          }

                        </TextField>
                      </div>

                      <TableContainer component={Paper}>
                        <Table className={classes.table} aria-label="simple table">
                          <TableHead>
                            <TableRow>
                              <TableCell align="center">Node/Branch</TableCell>
                              <TableCell align="center">Value</TableCell>
                              <TableCell align="center">Unit</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {result.text.map((line, index) => (
                              <TableRow key={index}>
                                <TableCell align="center">{line.split('=')[0]}</TableCell>
                                <TableCell align="center">
                                  {(line.split(' ')[3] === '\n')
                                    ? (parseFloat(line.split(' ')[2]))
                                    : (notation === 'Scientific'
                                      ? ((parseFloat(line.split(' ')[2]) / Math.pow(10, exactDecimal[index])).toFixed(precision).toString() + 'e' + ((exactDecimal[index]) >= 0
                                        ? '+' + (exactDecimal[index]).toString() : exactDecimal[index]).toString())
                                      : (parseFloat(line.split(' ')[2]) / scales[scalesNonGraphArray[index]]).toFixed(precision))}
                                </TableCell>
                                <TableCell align="center">{(scalesNonGraphArray[index] === 'si' || notation === 'Scientific' || line.split(' ')[3] === '\n') ? '' : scalesNonGraphArray[index]}{line.split(' ')[3]}</TableCell>
                              </TableRow>
                            ))
                            }

                          </TableBody>
                        </Table>
                      </TableContainer>

                    </Paper>
                  </Grid>
                  : <span></span>
              }</>
              : <Grid item xs={12} sm={12}>
                <Paper className={classes.paper}>
                  <Typography variant="h6" align="center" gutterBottom>
                    SOMETHING WENT WRONG PLEASE CHECK THE NETLIST.
                  </Typography>
                </Paper>
              </Grid>
            }
          </Grid>
        </Container>
      </Dialog>
    </div>
  )
}

SimulationScreen.propTypes = {
  open: PropTypes.bool,
  close: PropTypes.func,
  isResult: PropTypes.bool,
  taskId: PropTypes.string
  // simResults: PropTypes.object
}
