import React, { Component } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Col,
  Progress,
  Row,
  Table,
} from 'reactstrap';
import Radar from './Radar'

import ResClient from 'resclient';

class Position {
  x;
  y;
  z;

  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
}

class Velocity {
  mag;
  ux;
  uy;
  uz;

  constructor(mag, ux, uy, uz) {
    this.mag = mag;
    this.ux = ux;
    this.uy = uy;
    this.uz = uz;
  }
}

class Stacktrader extends Component {
  client;

  constructor(props) {
    super(props);

    console.dir(props)

    this.toggle = this.toggle.bind(this);

    this.client = new ResClient('ws://localhost:8080')

    this.state = {
      dropdownOpen: false,
      entity_id: "",
      position: new Position(0.0, 0.0, 0.0),
      velocity: new Velocity(0, 0.0, 0.0, 0.0),
      contacts: [],
      target: null
    };
  }

  componentDidMount() {
    this.setupPlayer("Player1");
  }

  setupPlayer(entity_id) {
    this.setState({ entity_id })
    this.setupLocalDemo();
  }

  handlePositionChange = (change) => {
    let position = {
      x: change.x ? change.x : this.state.position.x,
      y: change.y ? change.y : this.state.position.y,
      z: change.z ? change.z : this.state.position.z,
    }
    this.setState({ position })
  }

  handleVelocityChange = (change) => {
    let velocity = {
      mag: change.mag ? change.mag : this.state.velocity.mag,
      ux: change.ux ? change.ux : this.state.velocity.ux,
      uy: change.uy ? change.uy : this.state.velocity.uy,
      uz: change.uz ? change.uz : this.state.velocity.uz,
    }
    this.setState({ velocity })
  }

  navigateToTarget = (target) => {
    let p1target = {
      "rid": `${target}`,
      "eta_ms": 999999.9,
      "distance_km": 9990.0
    }
    this.client.call(`decs.components.the_void.Player1.target`, 'set', p1target).then(_res => {
      this.client.get(`decs.components.the_void.Player1.target`).then(target => {
        this.setState({ target })
        target.on('change', this.onUpdate)
      })
    })
  }

  onUpdate = () => {
    this.setState({})
  }

  // Demo functions begin
  setupLocalDemo() {
    this.client.get('decs.shards').then(_shards => {
      let position = this.state.position;
      let velocity = this.state.velocity;
      let radar_receiver = { "radius": 6.0 };
      let entity = this.state.entity_id

      this.client.call(`decs.components.the_void.${entity}.velocity`, 'set', velocity).then(_res => {
        this.client.get(`decs.components.the_void.${entity}.velocity`).then(velocity => {
          this.setState({ velocity })
          velocity.on('change', this.handleVelocityChange)
          this.client.call(`decs.components.the_void.${entity}.velocity`, 'set', { "mag": 1800, "ux": 1.0, "uy": 1.0, "uz": 0.0 })
        })
      });
      this.client.call(`decs.components.the_void.${entity}.position`, 'set', position).then(_res => {
        this.client.get(`decs.components.the_void.${entity}.position`).then(position => {
          this.setState({ position })
          position.on('change', this.handlePositionChange)
        })
      });
      this.client.call(`decs.components.the_void.${entity}.radar_receiver`, 'set', radar_receiver).then(_res => {
        this.setupRadarDemo()
        setTimeout(() => this.setupRadarContacts(entity), 500)
      })
    }).catch(err => {
      console.log(err);
    });
  }

  setupRadarContacts(entity) {
    this.client.get(`decs.components.the_void.${entity}.radar_contacts`).then(contacts => {
      contacts.on('add', this.onUpdate)
      contacts.on('remove', this.onUpdate)
      console.log(Array.from(contacts))
      this.setState({ contacts })
    }).catch(err => {
      console.log(err)
      setTimeout(() => this.setupRadarContacts(entity), 500)
    })
  }

  setupRadarDemo() {
    /**
     * Color guide:
     * CoreUI Red: f86c6b
     * CoreUI Yellow: ffc107
     * CoreUI Blue: 20a8d8
     * CoreUI Green: 4dbd74
     */
    this.setupEntity("sapphire_asteroid", -1, -1, 0, "20a8d8");
    this.setupEntity("ruby_asteroid", 2, 4, 0, "f86c6b");
    this.setupEntity("gold_asteroid", -2, 4, 0, "ffc107");
    this.setupEntity("friendly_spaceship", 10, 9, 0, "4dbd74");
    this.setupEntity("enemy_spaceship", 14, 7, 0, "f86c6b");
    this.setupEntity("starbase", 10, 10, 0, "ffc107");
    this.setupEntity("unknown_spaceship", 20, 20, 0, "ffc107");
  }

  setupEntity(name, x, y, z, color) {
    let position = { x, y, z };
    let velocity = { "mag": 0, "ux": 1.0, "uy": 1.0, "uz": 1.0 };
    let transponder = null;
    if (name.includes("asteroid")) {
      transponder = {
        object_type: "asteroid",
        display_name: name,
        hex_color: color
      }
    } else if (name.includes("ship")) {
      transponder = {
        object_type: "ship",
        display_name: name,
        hex_color: color
      }
    } else if (name.includes("starbase")) {
      transponder = {
        object_type: "starbase",
        display_name: name,
        hex_color: color
      }
    } else {
      return
    }
    this.client.call(`decs.components.the_void.${name}.transponder`, 'set', transponder);
    this.client.call(`decs.components.the_void.${name}.velocity`, 'set', velocity);
    this.client.call(`decs.components.the_void.${name}.position`, 'set', position);
  }
  // Demo functions ends

  toggle() {
    this.setState({
      dropdownOpen: !this.state.dropdownOpen,
    });
  }

  loading = () => <div className="animated fadeIn pt-1 text-center">Loading...</div>

  render() {

    return (
      <div className="animated fadeIn">
        <Row>
          <Col>
            <Card className="card-accent-success">
              <CardHeader>
                {this.state.entity_id}
              </CardHeader>
              <CardBody>
                <Row>
                  <Col>
                    <strong>Position:</strong> <br />
                    x: {this.state.position.x.toPrecision(3)} <br />
                    y: {this.state.position.y.toPrecision(3)} <br />
                    z: {this.state.position.z.toPrecision(3)} <br />
                  </Col>
                  <Col>
                    <strong>Velocity:</strong><br />
                    mag: {this.state.velocity.mag} <br />
                    ux: {this.state.velocity.ux} <br />
                    uy: {this.state.velocity.uy} <br />
                    uz: {this.state.velocity.uz} <br />
                  </Col>
                </Row>
              </CardBody>
            </Card>
          </Col>
          <Col>
            <Card className="card-accent-success">
              <CardHeader>
                Target
              </CardHeader>
              {this.state.target ? <CardBody>
                Targeting: {this.state.target.rid.split(".")[3]} <br />
                Distance:  {this.state.target.distance_km >= 1.1 ? this.state.target.distance_km.toPrecision(2) + "km" : "Target within range"} <br />
                ETA: {`${Math.floor(this.state.target.eta_ms / 1000 / 60 / 60)}h/
                    ${Math.floor(this.state.target.eta_ms / 1000 / 60)}m/
                    ${(this.state.target.eta_ms / 1000).toPrecision(3)}s`} <br />
              </CardBody>
                :
                <CardBody>
                  Targeting: No current target <br />
                  Distance: N/A <br />
                  ETA: N/A <br />
                </CardBody>}
            </Card>
          </Col>
          <Col>
            <Card className="card-accent-success">
              <CardHeader>
                {this.state.entity_id}'s Inventory
              </CardHeader>
              <CardBody>
                Empty
              </CardBody>
            </Card>
          </Col>
        </Row>

        <Row>
          <Col md="6">
            <Card>
              <CardHeader>
                Radar
              </CardHeader>
              <CardBody>
                {this.state.entity_id && <Radar client={this.client} shard="the_void" entity={this.state.entity_id} />}
              </CardBody>
            </Card>
          </Col>
          <Col md="6">
            <Card>
              <CardHeader>
                Radar Contacts
            </CardHeader>
              <CardBody>
                <br />
                <Table hover responsive className="table-outline mb-0 d-sm-table">
                  <thead className="thead-light">
                    <tr>
                      {/* <th className="text-center"><i className="icon-dashboard"></i></th> */}
                      <th>Contact</th>
                      <th>Distance</th>
                      <th>Angle</th>
                      {/* <th>Elevation</th> */}
                      {/* <th>Navigation</th> */}
                    </tr>
                  </thead>
                  <tbody>
                    {this.state.contacts && Array.from(this.state.contacts).map((contact, idx) =>
                      <tr style={{ cursor: 'pointer' }} onClick={() => this.navigateToTarget(`decs.components.the_void.${contact.entity_id}`)}>
                        {/* <td className="text-center">
                          <div className="avatar">
                            <img src={`assets/img/avatars/${idx + 1}.jpg`} className="img-avatar" alt="admin@bootstrapmaster.com" />
                            <span className="avatar-status badge-success"></span>
                          </div>
                        </td> */}
                        <td>
                          <div>{contact.entity_id}</div>
                        </td>
                        <td>
                          <div className="clearfix">
                            <div className="float-left">
                              <strong>{contact.distance_xy}km</strong>
                            </div>
                          </div>
                          <Progress animated className="mb-3" color={(Number.parseFloat(contact.distance) / 6.0) > 0.75 ? "warning" : "success"} value={100 * (Number.parseFloat(contact.distance) / 6.0)} />
                        </td>
                        <td>
                          {contact.azimuth ? contact.azimuth.toPrecision(3) : "NaN"}
                        </td>
                        {/* <td>
                          {contact.elevation ? contact.elevation.toPrecision(3) : "idk"}
                        </td> */}
                        {/* <td className="text-center">
                      <i className="icon-cursor"></i>
                    </td> */}
                      </tr>
                    )}
                  </tbody>
                </Table>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }
}

export default Stacktrader;