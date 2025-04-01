/*!

=========================================================
* Argon Design System React - v1.1.2
=========================================================

* Product Page: https://www.creative-tim.com/product/argon-design-system-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)
* Licensed under MIT (https://github.com/creativetimofficial/argon-design-system-react/blob/master/LICENSE.md)

* Coded by Creative Tim

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/
/*eslint-disable*/
import React from "react";

// reactstrap components
import { Button, Container, Row, Col, UncontrolledTooltip } from "reactstrap";

class About extends React.Component {
  render() {
    return (
      <>
        <section className="section section-lg">
          <Container>
            <Row className="row-grid justify-content-center">
              <Col className="text-center" lg="8">
                <h2 className="display-3">
                  Would you like a quick design <span className="text-success">Solution for your Structural problems?</span>
                </h2>
                <p className="lead">
                  Then you've come to the right place. Click the services button below to navigate to the services we offer you.
                  Send us your problem we will provide you with the efficient solution with in 24hrs.
                </p>
                <div className="btn-wrapper"></div>
                <div className="text-center">
                  <h4 className="display-4 mb-5 mt-5">We have these services available</h4>
                  <Row className="justify-content-center">
                    <Col lg="2" xs="4">
                      <a id="tooltip255035741" target="_blank">
                        <img alt="..." className="img-fluid" src="https://cdn-icons-png.flaticon.com/128/1340/1340555.png" />
                      </a>
                      <UncontrolledTooltip delay={0} target="tooltip255035741">
                        Calculations of a structural part for - Renovating buindings
                      </UncontrolledTooltip>
                    </Col>
                    <Col lg="2" xs="4">
                      <a id="tooltip233150499" target="_blank">
                        <img alt="..." className="img-fluid" src="https://cdn-icons-png.flaticon.com/128/3638/3638801.png" />
                      </a>
                      <UncontrolledTooltip delay={0} target="tooltip233150499">
                        Calculations of a structural part for - New buindings
                      </UncontrolledTooltip>
                    </Col>
                  </Row>
                </div>
              </Col>
            </Row>
          </Container>
        </section>
      </>
    );
  }
}

export default About;
